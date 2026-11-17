class App {
  constructor() {
    this.viewport = new Viewport();
    this.theme = new ThemeSwitch($("themeBtn"));
    this.sound = new SoundSwitch($("soundBtn"));
    this.games = [new WikopyGame(), new KaplabGame(), new IncscapeGame(), new CooktouGame(), new WordHuntGame(), new WhereWordGame()];
    this.launcher = new Launcher(this.games);
  }

  game(id) {
    return this.games.find((game) => game.id === id);
  }
}

const app = new App();
