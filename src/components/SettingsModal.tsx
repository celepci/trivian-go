import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { SafeTranslationFunction } from "../i18n/config";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface GameSettings {
  answerTime: '30' | '45' | '60';
  showOptions: boolean;
  soundEnabled: boolean;
}

export const getGameSettings = (): GameSettings => {
  const settingsStr = localStorage.getItem('gameSettings');
  if (!settingsStr) {
    const defaultSettings: GameSettings = {
      answerTime: '30',
      showOptions: false,
      soundEnabled: true,
    };
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const settings = JSON.parse(settingsStr);
    return {
      answerTime: settings.answerTime,
      showOptions: settings.showOptions,
      soundEnabled: settings.soundEnabled ?? true,
    };
  } catch {
    return {
      answerTime: '30',
      showOptions: false,
      soundEnabled: true,
    };
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const safeT = t as SafeTranslationFunction;
  const [settings, setSettings] = useState(getGameSettings());

  const handleSaveSettings = (newSettings: GameSettings) => {
    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader className="relative">
          <DialogTitle className="text-white">{safeT('settingsModal.title', 'Settings')}</DialogTitle>
          <DialogClose className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-gray-900 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-800">
            <X className="h-4 w-4 text-gray-300" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-gray-200">{safeT('settingsModal.answerTime', 'Answer Time')}</Label>
              <Select
                value={settings.answerTime}
                onValueChange={(value: '30' | '45' | '60') =>
                  handleSaveSettings({ ...settings, answerTime: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                  <SelectValue placeholder={safeT('settingsModal.selectTime', 'Select Time')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="30" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                    30 {safeT('settingsModal.seconds', 'seconds')}
                  </SelectItem>
                  <SelectItem value="45" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                    45 {safeT('settingsModal.seconds', 'seconds')}
                  </SelectItem>
                  <SelectItem value="60" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                    60 {safeT('settingsModal.seconds', 'seconds')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-200">{safeT('settingsModal.showOptions', 'Show Options')}</Label>
              <Switch
                checked={settings.showOptions}
                onCheckedChange={(checked) =>
                  handleSaveSettings({ ...settings, showOptions: checked })
                }
                className="data-[state=unchecked]:bg-gray-800 data-[state=checked]:bg-pink-500 border-gray-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-200">{safeT('settingsModal.soundEnabled', 'Sound Enabled')}</Label>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  handleSaveSettings({ ...settings, soundEnabled: checked })
                }
                className="data-[state=unchecked]:bg-gray-800 data-[state=checked]:bg-pink-500 border-gray-700"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
