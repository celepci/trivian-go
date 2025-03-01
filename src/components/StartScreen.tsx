import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Language, Player } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Toaster } from './ui/toaster';
import { Plus, X, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SafeTranslationFunction } from '../i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SettingsModal } from './SettingsModal';

interface GroupForm {
  id: string;
  name: string;
  players: Player[];
  badges: string[];
}

export const StartScreen: React.FC = () => {
  const { startGame } = useGame();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const safeT = t as SafeTranslationFunction;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  // Kayıtlı grupları ve dil tercihini yükle
  const [groups, setGroups] = useState<GroupForm[]>(() => {
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      const parsedGroups = JSON.parse(savedGroups);
      // Grup ID'lerinin varlığını kontrol et
      return parsedGroups.map((group: GroupForm, index: number) => ({
        ...group,
        id: group.id || `group-${Date.now()}-${index}`
      }));
    }
    return [
      {
        id: `group-${Date.now()}-0`,
        name: '',
        players: [{ id: '1', name: '', score: 0, badges: [] }],
        badges: []
      },
      {
        id: `group-${Date.now()}-1`,
        name: '',
        players: [{ id: '2', name: '', score: 0, badges: [] }],
        badges: []
      },
    ];
  });

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      return savedLanguage === 'tr' ? Language.TR : Language.EN;
    }
    return navigator.language.startsWith('tr') ? Language.TR : Language.EN;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Grup değişikliklerini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('groups', JSON.stringify(groups));
  }, [groups]);

  const handleAddGroup = () => {
    if (groups.length >= 3) {
      toast({
        variant: "warning",
        title: safeT('startScreen.errors.maxGroup', 'Maximum Group Limit'),
        description: safeT('startScreen.errors.maxGroupDesc', 'You can only add up to 3 groups')
      });
      return;
    }
    setGroups([
      ...groups,
      {
        id: `group-${Date.now()}-${groups.length}`,
        name: '',
        players: [{
          id: Date.now().toString(), name: ''
        }],
        badges: []
      },
    ]);
  };

  const handleAddPlayer = (groupIndex: number) => {
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].players.push({
      id: Date.now().toString(),
      name: ''
    });
    setGroups(updatedGroups);
  };

  const handleRemovePlayer = (groupIndex: number, playerIndex: number) => {
    const updatedGroups = [...groups];
    if (updatedGroups[groupIndex].players.length > 1) {
      updatedGroups[groupIndex].players.splice(playerIndex, 1);
      setGroups(updatedGroups);
    } else if (groupIndex === 2) {
      // 3. grup ise ve son oyuncu siliniyorsa, grubu tamamen sil
      updatedGroups.splice(groupIndex, 1);
      setGroups(updatedGroups);
    } else {
      toast({
        variant: "warning",
        title: safeT('startScreen.errors.minPlayer', "Minimum Player Limit"),
        description: safeT('startScreen.errors.minPlayerDesc', "You must have at least one player in each group"),
      });
    }
  };

  const handleGroupNameChange = (groupIndex: number, name: string) => {
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].name = name;
    setGroups(updatedGroups);
  };

  const handlePlayerNameChange = (
    groupIndex: number,
    playerIndex: number,
    name: string
  ) => {
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].players[playerIndex].name = name;
    setGroups(updatedGroups);
  };

  const handleStartGame = () => {
    if (groups.length === 0) {
      toast({
        title: safeT('startScreen.noGroups', "No Groups"),
        variant: "destructive",
      });
      return;
    }

    // Grupları hazırla
    const preparedGroups = groups.map((group, index) => {
      // Eğer id boşsa yeni bir id oluştur
      const groupId = group.id || `group-${Date.now()}-${index}`;
      console.log("Group ID:", groupId);
      
      return {
        id: groupId,
        name: group.name || `Grup ${index + 1}`,
        score: 0,
        jokers: 3,
        players: group.players,
        badges: [],
        correctAnswers: 0,
        wrongAnswers: 0,
        position: index + 1
      };
    });

    console.log("Prepared Groups:", preparedGroups);
    startGame(preparedGroups, selectedLanguage);
  };

  return (
    <div className="min-h-screen px-8 flex flex-col items-center relative">
      <div className="flex items-center space-x-4 absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Select
          value={i18n.language}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tr">{safeT('language.tr', 'Turkish')}</SelectItem>
            <SelectItem value="en">{safeT('language.en', 'English')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <img src="/logo.png" alt="Trivia Night" className="w-64 mb-12" />
      
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {groups.map((group, groupIndex) => (
          <Card key={group.id} className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                {groupIndex + 1}. {safeT('startScreen.group', 'Group')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor={`group-${groupIndex}`}>
                  {safeT('startScreen.groupName', 'Group Name')}
                </Label>
                <Input
                  id={`group-${groupIndex}`}
                  placeholder={safeT('startScreen.groupName', 'Group Name')}
                  value={group.name}
                  onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
                />
              </div>

              {group.players.map((player, playerIndex) => (
                <div key={player.id} className="flex gap-2">
                  <Input
                    id={`player-${groupIndex}-${playerIndex}`}
                    placeholder={safeT('startScreen.playerName', 'Player Name')}
                    value={player.name}
                    onChange={(e) =>
                      handlePlayerNameChange(groupIndex, playerIndex, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemovePlayer(groupIndex, playerIndex)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                onClick={() => handleAddPlayer(groupIndex)}
                variant="outline"
                className="w-full"
              >
                {safeT('startScreen.addPlayer', 'Add Player')}
              </Button>
            </CardContent>
          </Card>
        ))}

        {groups.length < 3 && (
          <Card className="border-none shadow-lg flex flex-col justify-center items-center min-h-[300px] hover:bg-gray-100/50 transition-colors cursor-pointer group">
            <Button
              onClick={handleAddGroup}
              variant="ghost"
              className="flex flex-col items-center gap-4 w-full h-full p-8"
            >
              <Plus className="w-12 h-12 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-medium">
                {safeT('startScreen.addGroup', 'Add Group')}
              </span>
            </Button>
          </Card>
        )}
      </div>

      <Button
        onClick={handleStartGame}
        className="mt-12 bg-gradient-to-r from-[#4633EA] via-[#E633D4] to-[#00D1FF] hover:opacity-90 text-white px-16 py-8 rounded-xl text-xl font-medium w-full max-w-xl shadow-lg"
      >
        {safeT('startScreen.startGame', 'Start Game')}
      </Button>

      <Toaster />
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};
