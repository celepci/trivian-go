import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Language, Player } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Toaster } from './ui/toaster';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomTFunction } from '../i18n/config';
import type { TFunction } from 'i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface GroupForm {
  name: string;
  players: Player[];
}

export const StartScreen: React.FC = () => {
  const { startGame } = useGame();
  const { toast } = useToast();
  const { t: translate, i18n } = useTranslation();
  const t = translate as CustomTFunction;
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  // Kayıtlı grupları ve dil tercihini yükle
  const [groups, setGroups] = useState<GroupForm[]>(() => {
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      return JSON.parse(savedGroups);
    }
    return [
      {
        name: '',
        players: [{ id: '1', name: '', score: 0, badges: [] }],
      },
      {
        name: '',
        players: [{ id: '2', name: '', score: 0, badges: [] }],
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

  // Grup değişikliklerini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('groups', JSON.stringify(groups));
  }, [groups]);

  const handleAddGroup = () => {
    if (groups.length >= 3) {
      toast({
        variant: "warning",
        title: t('startScreen.errors.maxGroup'),
        description: t('startScreen.errors.maxGroup')
      });
      return;
    }
    setGroups([
      ...groups,
      {
        name: '',
        players: [{
          id: Date.now().toString(), name: ''
        }],
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
    } else {
      toast({
        variant: "warning",
        title: t("startScreen.errors.minPlayer"),
        description: t("startScreen.errors.minPlayer"),
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
    const isValid = groups.every(
      (group) =>
        group.name.trim() !== '' &&
        group.players.every((player) => player.name.trim() !== '')
    );

    if (!isValid) {
      toast({
        variant: "warning",
        title: t('startScreen.errors.missingInfo'),
        description: t('startScreen.errors.missingInfo'),
      });
      return;
    }

    startGame(groups, selectedLanguage);
  };

  return (
    <div className="min-h-screen px-8 flex flex-col items-center relative">
      <div className="absolute top-8 right-8">
        <Select defaultValue={localStorage.getItem('selectedLanguage') || (navigator.language.startsWith('tr') ? 'tr' : 'en')} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tr">{t('language.tr')}</SelectItem>
            <SelectItem value="en">{t('language.en')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <img src="/logo.png" alt="Trivia Night" className="w-64 mb-12" />
      
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {groups.map((group, groupIndex) => (
          <Card key={groupIndex} className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                {groupIndex + 1}. {i18n.exists('startScreen.group') ? t('startScreen.group') : 'Grup'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor={`group-${groupIndex}`}>
                  {t('startScreen.groupName')}
                </Label>
                <Input
                  id={`group-${groupIndex}`}
                  placeholder={t('startScreen.groupName')}
                  value={group.name}
                  onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
                />
              </div>

              {group.players.map((player, playerIndex) => (
                <div key={player.id} className="flex gap-2">
                  <Input
                    id={`player-${groupIndex}-${playerIndex}`}
                    placeholder={t('startScreen.playerName')}
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
                {t('startScreen.addPlayer')}
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
                {t('startScreen.addGroup')}
              </span>
            </Button>
          </Card>
        )}
      </div>

      <Button
        onClick={handleStartGame}
        className="mt-12 bg-gradient-to-r from-[#4633EA] via-[#E633D4] to-[#00D1FF] hover:opacity-90 text-white px-16 py-8 rounded-xl text-xl font-medium w-full max-w-xl shadow-lg"
      >
        {t('startScreen.startGame')}
      </Button>

      <Toaster />
    </div>
  );
};
