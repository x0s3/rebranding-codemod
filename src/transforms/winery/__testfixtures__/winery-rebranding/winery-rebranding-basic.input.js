import {
  Avatar,
  Button,
  List,
  Logo,
  ThemeProvider,
} from '@xingternal/winery-ui';

const Noop = () => {
  return (
    <ThemeProvider>
      <List>
        <Avatar />
        <Logo />
        <Button>Click me!</Button>
      </List>
    </ThemeProvider>
  );
};

export { Noop };
