/*!
 * Copyright (c) 2019, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */
import { _ } from 'okta';
import '../../views/shared/FooterWithBackLink';
import BaseLoginController from './BaseLoginController';
import ViewFactory from '../view-builder/ViewFactory';

export default BaseLoginController.extend({
  className: 'form-controller',
  initialize: function () {
    BaseLoginController.prototype.initialize.call(this);

    this.listenTo(this.options.appState, 'change:currentFormName', this.render);
    this.listenTo(this.options.appState, 'invokeAction', this.invokeAction);
    this.listenTo(this.options.appState, 'saveForm', this.handleFormSave);
  },

  preRender () {
    this.removeChildren();
  },

  postRender () {
    const currentViewState = this.options.appState.getCurrentViewState();

    if (currentViewState.name === 'select-factor') {
      if (this.options.appState.get('isAuthenticateStep')) {
        currentViewState.name = 'select-factor-challenge';
      } else {
        currentViewState.name = 'select-factor-enroll';
      }
    }

    const TheView = ViewFactory.create(
      currentViewState.name,
      this.options.appState.get('factorType')
    );
    this.formView = this.add(TheView, {
      options: {
        currentViewState,
      }
    }).last();

    this.listenTo(this.formView, 'save', this.handleFormSave);
  },

  invokeAction (actionPath = '') {
    // handle select-factor form
    if (actionPath === 'select-factor') {
      // setting factor to null to adjust the beacon header in the select-factor view
      this.options.appState.set('factor', {});
      // trigger formname change to change view
      this.options.appState.set('currentFormName', actionPath);
      return;
    }
    const paths = actionPath.split('.');
    let targetObject;
    if (paths.length === 1) {
      targetObject = this.options.appState.get('currentState');
    } else {
      targetObject = this.options.appState.get(paths.shift());
    }
    // At the time of writting, action only lives in first level of state objects.
    const actionFn = targetObject[paths.shift()];

    if (_.isFunction(actionFn)) {
      // TODO: OKTA-243167
      // 1. what's the approach to show spinner indicating API in fligh?
      // 2. how to catch error?
      actionFn()
        .then(resp => {
          this.options.appState.trigger('remediationSuccess', resp.response);
        })
        .catch();
    }
  },

  handleFormSave (model) {
    const formName = model.get('formName');
    const actionFn = this.options.appState.get('currentState')[formName];

    if (!_.isFunction(actionFn)) {
      model.trigger('error', `Cannot find http action for "${formName}".`);
      return;
    }

    model.trigger('request');
    return actionFn(model.toJSON())
      .then(resp => {
        this.options.appState.trigger('remediationSuccess', resp.response);
      })
      .catch(error => {
        model.trigger('error', error);
      });
  },
});