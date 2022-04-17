import { TIME_RESTART_APP } from './config/appConfig';
import { App } from './app';

async function bootstrap() {
  const app = new App();

  app.start();

  setInterval(() => {
    app.start(true);
  }, TIME_RESTART_APP);
}
bootstrap();
