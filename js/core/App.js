class App {
  constructor() {
    this.theme = new ThemeSwitch($("themeBtn"));
    this.sound = new SoundSwitch($("soundBtn"));
    this.games = [new WikopyGame(), new KaplabGame(), new IncscapeGame(), new CooktouGame()];
    this.launcher = new Launcher(this.games);
  }

  game(id) {
    return this.games.find((game) => game.id === id);
  }
}

const app = new App();
