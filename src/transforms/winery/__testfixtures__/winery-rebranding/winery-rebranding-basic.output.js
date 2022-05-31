import { List, Logo, ThemeProvider } from '@xingternal/winery-ui';
import { Avatar, Button, RebrandingProvider } from '@xingternal/rebranding-adapter/winery';

const Noop = () => {
  return (
    /*
    * TODO (Rebranding-Codemod generated): Please provide a feature flag.
    * Feature Flag Name = REBRANDING_ONLYFY_BERRY :)
    */
    <RebrandingProvider enabled={false}><ThemeProvider>
        <List>
          <Avatar />
          <Logo />
          <Button>Click me!</Button>
        </List>
      </ThemeProvider></RebrandingProvider>
  );
};

export { Noop };
