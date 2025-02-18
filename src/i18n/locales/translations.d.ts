declare module '*.json' {
  const content: {
    startScreen: {
      group: string;
      groupName: string;
      playerName: string;
      addPlayer: string;
      addGroup: string;
      startGame: string;
      errors: {
        minPlayer: string;
        maxGroup: string;
        missingInfo: string;
      };
    };
    language: {
      tr: string;
      en: string;
    };
  };
  export = content;
}
