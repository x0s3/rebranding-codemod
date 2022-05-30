import { List, Logo } from '@xingternal/winery-ui';
import { Avatar, Button } from '@xingternal/rebranding-adapter/winery';

const Noop = () => {
  return (
    <List>
      <Avatar />
      <Logo />
      <Button>Click me!</Button>
    </List>
  );
};

export { Noop };
