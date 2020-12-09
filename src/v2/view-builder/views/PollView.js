import { loc } from 'okta';
import BaseView from '../internals/BaseView';
import BaseForm from '../internals/BaseForm';
import polling from './shared/polling';

const Body = BaseForm.extend(Object.assign(
  {
    title () {
      return  loc('safemode.poll.title', 'login');
    },

    noButtonBar: true,
    
    initialize () {
      BaseForm.prototype.initialize.apply(this, arguments);
      this.startPolling();
    },

    render () {
      BaseForm.prototype.render.apply(this, arguments);
      this.add('<div class="okta-waiting-spinner"></div>');
    },

    remove () {
      BaseForm.prototype.remove.apply(this, arguments);
      this.stopPolling();
    }
  },

  polling,
));

export default BaseView.extend({
  Body
});
