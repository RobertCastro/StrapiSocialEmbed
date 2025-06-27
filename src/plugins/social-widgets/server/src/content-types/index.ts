import socialAccount from './social-account/schema.json';
import widgetConfiguration from './widget-configuration/schema.json';
import pkceSession from './pkce-session/schema.json';

export default {
  'social-account': { schema: socialAccount },
  'widget-configuration': { schema: widgetConfiguration },
  'pkce-session': { schema: pkceSession },
};
