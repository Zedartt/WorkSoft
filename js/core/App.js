class App {
  constructor() {
    this.viewport = new Viewport();
    this.theme = new ThemeSwitch([$("themeBtn"), $("menuThemeBtn")]);
    this.sound = new SoundSwitch([$("soundBtn"), $("menuSoundBtn")]);
    this.games = [new WikopyGame(), new KaplabGame(), new IncscapeGame(), new CooktouGame(), new WordHuntGame(), new WhereWordGame(), new HooplabGame(), new HorseringGame(), new WheeeeelGame(), new WordKingGame()];
    this.help = new HelpPanel(this.games);
    this.launcher = new Launcher(this.games);
  }

  game(id) {
    return this.games.find((game) => game.id === id);
  }
}

const app = new App();
