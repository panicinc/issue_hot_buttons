/**
 * Redmine Issue Hot Buttons plugin
 * Issue page
 */
jQuery(document).ready(function() {

  /**
   * Parent object for all hot buttons
   */
  var AbstractHotButton = Class.create(IssueHotButtons, {

    /**
     * Constructor
     */
    initialize: function(){
      this.i18n_strings = new Hash(this.i18n_strings);
    },

    /**
     * Translate string using IssueHotButtonsSettings locale strings store
     *
     * @param  key i18n identifier
     * @param  get_back Get back i18n ID if translation not exists
     *
     * @return Translated string or input key if translation not found
     */
    _: function(key, get_back){
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    },

    /**
     * Check is button suitable for current context
     *
     * @return boolean
     */
    check_conditions: function() {
      var t = this;
      var allow = true;
      [
        'issue_assigned_to',
        'issue_not_assigned_to',
        'issue_status',
        'issue_status_is_not',
        'issue_tracker',
        'issue_tracker_is_not',
        'project',
        'project_is_not',
        'user_role',
        'user_role_is_not'
      ].each(function(condition_name) {
        if (! allow) return false;
        var condition = t.config.get(condition_name);
        if (! condition) return false;
        condition = condition.evalJSON();
        
        var result;
        
        switch(condition_name) {
          
          case 'issue_assigned_to':
          case 'issue_not_assigned_to':
            var allowed_users = [];
            var assigned_to = t.issue.assigned_to_id;
            condition.each(function(role) {
              if (! Object.isUndefined(t.users_per_role[role])) {
                allowed_users = allowed_users.concat(t.users_per_role[role]);
              }
            });
            result = allowed_users.uniq().indexOf(assigned_to) > -1;
            result = 'issue_assigned_to' == condition_name
              ? result
              : ! result;
            break;
          
          case 'user_role':
          case 'user_role_is_not':
            var allowed_users = [];
            var current_user = t.users_per_role.current_user;
            condition.each(function(role) {
              if (! Object.isUndefined(t.users_per_role[role])) {
                allowed_users = allowed_users.concat(t.users_per_role[role]);
              }
            });
            result = allowed_users.uniq().indexOf(current_user) > -1;
            result = 'user_role' == condition_name
              ? result
              : ! result;
            break;
          
          case 'issue_status':
          case 'issue_status_is_not':
            var issue_status = t.issue.status_id.toString();
            result = condition.indexOf(issue_status) > -1;
            result = 'issue_status' == condition_name
              ? result
              : ! result;
            break;
            
          case 'issue_tracker':
          case 'issue_tracker_is_not':
            var issue_tracker = t.issue.tracker_id.toString();
            result = condition.indexOf(issue_tracker) > -1;
            result = 'issue_tracker' == condition_name
              ? result
              : ! result;
            break;
            
          case 'project':
          case 'project_is_not':
            var issue_project = t.issue.project_id.toString();
            result = condition.indexOf(issue_project) > -1;
            result = 'project' == condition_name
              ? result
              : ! result;
            break;

        }
        
        allow = result;
      });
      
      return allow;
    },

    /**
     * Hide optional button controls
     *
     * @param event (optional) If method used as event listener
     * @return void
     */
    hide_optional: function(event) {
      $P('issue_hot_buttons').select('button').each(function(btn){
        btn.removeAttribute('disabled');
        btn.setStyle({opacity: 1});
      });
      if (event) {
        var element = Event.element(event);
        element.up(1).remove();
      }
      else {
        $P('issue_hot_buttons_additional').remove();
      }
    },

    /**
     * Clone element from issue update form
     * Perform additional things for fileds with datepickers
     *
     * @param element_id Element ID
     * @return form element
     */
    get_mirrored_element: function(element_id) {
      var tmp_id = [element_id, Math.round(Math.random() * 10000000)].join('_');

      var original_element = $P(element_id);
      if (! original_element) return false;

      var mirrored_element = original_element.up().clone(true);
      mirrored_element.select('input, select, textarea').each(function(element){
        if ('hidden' === element.type) {
          element.remove();
          return;
        }
        element.writeAttribute('id', tmp_id);
        element.addClassName(element_id);
      });
      var mirrored_label = mirrored_element.select('label').first();
      mirrored_label.writeAttribute('for', tmp_id);
      

      // Special magic for calendar inputs
      var calendar_field = mirrored_element.select('img.calendar-trigger').first();
      if (! Object.isUndefined(calendar_field)) {
        calendar_field.removeAttribute('id');
        Calendar.setup({
          inputField : mirrored_element.select('input').first(),
          ifFormat : '%Y-%m-%d',
          button : calendar_field
        });
      }

      // Special magic for textareas
      var textarea = mirrored_element.select('textarea').first();
      if (! Object.isUndefined(textarea)) {
        textarea.removeAttribute('style');
        textarea.writeAttribute('cols', 30);
        textarea.writeAttribute('rows', 5);
      }

      // Special magic for target version fields
      var add_version = mirrored_element.select('.issue_fixed_version_id').first();
      if (! Object.isUndefined(add_version)) {
        var add_version_control = mirrored_element.select('a').first().remove();
      }

      /*Event.observe(mirrored_element.select('input,select').first(), 'change', function(event) {
        original_element.value = Event.element(event).value;
      });*/

      return mirrored_element;
    }

  });

  /**
   * Issue Update Hot Button
   */
  var IssueUpdateButton = Class.create(AbstractHotButton, {

    /**
     * Optional fileds in custom order
     */
    fields: [
      'assign_to_other',
      'include_standart_fields',
      'include_custom_fields',
      'include_comment',
      'include_file_attachment'
    ],

    /**
     * Hot button rendering entry point
     *
     * @param config
     * @return <button /> element
     */
    render: function(config) {
      this.config = new Hash(config);

      // button is not suitable for current context
      if (this.check_conditions() && this.is_workflow_suitable()) {
        return this.render_button();
      }

      return false;
    },

    /**
     * Check is button need optional controls,
     * e.g. select user for reassign
     *
     * @return boolean
     */
    has_additional_controls: function(){
      var t = this;
      var no_additional = true;
      [
        'assign_to_other',
        'include_standart_fields',
        'include_custom_fields',
        'include_comment',
        'include_file_attachment'
      ].each(function(i){
        if (! Object.isUndefined(t.config.get(i))) {
          switch(i) {
            case 'assign_to_other':
              var assign_to = t.config.get('assign_to_other').evalJSON();
              if (assign_to.length > 1) {
                no_additional = no_additional && false;
              }
              if (['current_user', 'nobody'].indexOf(assign_to[0]) === -1) {
                no_additional = no_additional && false;
              }
              break;
            case 'include_comment':
              var include_comment = t.config.get('include_comment').evalJSON();
              if (include_comment) {
                no_additional = no_additional && false;
              }
              break;
            default:
              no_additional = no_additional && false;
              break;
          };
        }
      });
      return ! no_additional;
    },
    
    /**
     * Check is current button suitable for current workflow settings
     *
     * @return boolean
     */
    is_workflow_suitable: function() {
      var t = this;
      var suitable = true;
      
      [
        'assign_to_other',
        'set_issue_status',
        'include_custom_fields',
        'include_standart_fields'
      ].each(function(option){
        var setting = t.config.get(option);
        if (! setting) return false;
        
        switch(option) {
          case 'assign_to_other':
            // Check can current issue be assigned to configured user roles
            var assign_to_roles = t.config.get('assign_to_other').evalJSON();
            var configures_users = [];
            assign_to_roles.each(function(role_id){
              if (! Object.isUndefined(t.users_per_role[role_id])) {
                configures_users = configures_users.concat(t.users_per_role[role_id]);
              }
            });
            configures_users = configures_users.uniq();
            if (configures_users.length && $P('issue_assigned_to_id')) {
              configures_users.each(function(user_id){
                user_id = user_id ? user_id : '';
                suitable = suitable
                  && $$P('#issue_assigned_to_id option[value="' + user_id + '"]').length > 0;
              });
            }
            else {
              suitable = suitable && false;
            }
            break;
            
          case 'set_issue_status':
            var set_issue_status = t.config.get('set_issue_status').evalJSON().first();
            var available_statuses = [];
            $$P('#issue_status_id option').each(function(option){
              available_statuses.push(option.value);
            });
            suitable = suitable && -1 < available_statuses.indexOf(set_issue_status);
            break;
          
          case 'include_standart_fields':
            var default_fields = t.config.get('include_standart_fields').evalJSON();
            default_fields.each(function(field_id){
              var default_field = $P(field_id);
              suitable = suitable &&
                (default_field && ! default_field.disabled);
            });
            break;
            
          case 'include_custom_fields':
            var custom_fields = t.config.get('include_custom_fields').evalJSON();
            custom_fields.each(function(field_num){
              var field_id = ['issue_custom_field_values', field_num].join('_');
              var custom_field = $P(field_id);
              suitable = suitable &&
                (custom_field && ! custom_field.disabled);
            });
            break;
        }
      });

      return suitable;
   },

    /**
     * Render hot button and attach click listener
     *
     * @return <button /> element
     */
    render_button: function() {
      var t = this;
      
      //var button = new Element('button', {'class': 'action'})
      var button = new Element('button', {'class': 'action'})  //collapse_section'})
        .insert(this.config.get('caption'));
      button.config = this.config;

      if(this.has_additional_controls()) {
        Event.observe(button, 'click', function(event){
          t.hot_button_opt_action(event, t);
        });
      }
      else {
        Event.observe(button, 'click', function(event) {
          t.hot_button_submit_action(event, t);
        });
      }

      return button;
    },

    /**
     * Event listener for hot buttons with optional controls
     * Displays opt. controls and add event listeners
     *
     * @param event Event
     * @param t     IssueUpdateButton context
     * @return void
     */
    hot_button_opt_action: function(event, t) {
      var hot_button = Event.element(event);
      
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.15});
      });

      hot_button.setStyle({opacity: 1});

      var submit_button = new Element('button', {'class': 'submit'})
        .insert(t._('submit'));
      submit_button.config = hot_button.config;
      Event.observe(submit_button, 'click', function(event) {
        t.hot_button_submit_action(event, t);
        t.hide_optional();
      });
      
      var additional_wrapper = new Element('div', {
        'class': 'optional_wrapper'
      });
    
      var optional_controls = t.get_opt_controls(hot_button.config);
    
      optional_controls.each(function(element) {
        additional_wrapper.insert(element);
      });

      additional_wrapper.insert(submit_button);

      var close_button = new Element('a', {
        'class': 'icon_close',
        href: 'javascript:void(0)'
      });
      Event.observe(close_button, 'click', function(e) {
        if ($$P('#issue_hot_buttons_additional #attachments_fields').length > 0) {
          $$P('#issue-form .box fieldset').last().insert(
            $P('attachments_fields').up()
          );
        }
        t.hide_optional(e);
      })

      var additional_container = new Element('div', {
        id: 'issue_hot_buttons_additional',
        'class': 'update_issue'
      })
        .insert(new Element('div', {'class': 'controls'}).insert(close_button))
        .insert(additional_wrapper);
      $P('issue_hot_buttons').insert({after: additional_container});
      
      additional_container
        .select('textarea, input, select')
        .first().focus();
    },

    /**
     * Render optional controls
     *
     * @param button_config Hot button configuration
     * @return array Hot buttons array
     */
    get_opt_controls: function(button_config) {
      t = this;
      var elements = [];

      this.fields.each(function(field){
        if (! button_config.get(field)) return false;
        switch(field) {

          case 'assign_to_other':
            var assign_to_roles = button_config.get('assign_to_other').evalJSON();
            if (assign_to_roles.length == 1 && assign_to_roles.first() == 'current_user') {
              return;
            }
            var mirrored_element = t.get_mirrored_element('issue_assigned_to_id');

            var allowed_users = [];
            assign_to_roles.each(function(role_id){
              if (! Object.isUndefined(t.users_per_role[role_id])) {
                allowed_users = allowed_users.concat(t.users_per_role[role_id]);
              }
            });
            allowed_users = allowed_users.uniq();
            mirrored_element.select('select option').each(function(option){
              value = parseInt(option.readAttribute('value'));
              if (0 > allowed_users.indexOf(value)) {
                option.remove();
              }
            });

            elements.push(mirrored_element);
            break;

          case 'include_standart_fields':
            var standart_fields = button_config.get('include_standart_fields').evalJSON();
            standart_fields.each(function(standart_field){
              elements.push(t.get_mirrored_element(standart_field));
            });
            break;

          case 'include_custom_fields':
            var custom_fields = button_config.get('include_custom_fields').evalJSON();
            custom_fields.each(function(custom_field_id) {
              elements.push(
                t.get_mirrored_element(['issue_custom_field_values', custom_field_id].join('_'))
              );
            });
            break;

          case 'include_comment':
            var include_comment = button_config.get('include_comment').evalJSON();
            if (include_comment) {
              var comment_element = new Element('p');
              comment_element.insert(new Element('label').update(t._('notes')));
              comment_element.insert(new Element('textarea', {
                'class': 'notes',
                cols: 30,
                rows: 5
              }));
              var comment_default_value = button_config.get('set_comment_value');
              if (comment_default_value) {
                comment_element.select('textarea').first().value = comment_default_value;
              }
              elements.push(comment_element);
            }
            break;
            
          case 'include_file_attachment':
            var file_attachment_block = $('attachments_fields').up();
            file_attachment_block.addClassName('attachments_wrapper');
            elements.push(file_attachment_block);
            break;

        }
      });
      return elements;
    },

    /**
     * Submit hot button action
     *
     * @param event Event object
     * @param t     IssueUpdateButton context
     */
    hot_button_submit_action: function(event, t){
      var button = Event.element(event);

      [      
        'assign_to_other',
        'include_comment',
        'include_custom_fields',
        'include_standart_fields',
        'set_done',
        'set_issue_status',
        'include_file_attachment'
      ].each(function(option){
        if (! button.config.get(option)) return false;
        switch(option) {

          case 'assign_to_other':
            var assign_to = button.config.get('assign_to_other').evalJSON();
            if (assign_to.length === 1 && ['current_user', 'nobody'].indexOf(assign_to[0]) > -1) {
              var user_to_reassign = t.users_per_role[assign_to[0]];
              user_to_reassign = user_to_reassign
                ? user_to_reassign.toString()
                : '';
              
              $P('issue_assigned_to_id').value = user_to_reassign;
            }
            else {
              $P('issue_assigned_to_id').value =
                button.up().select('select.issue_assigned_to_id').first().value;
            }
            break;

          case 'set_done':
            var set_done = button.config.get('set_done').evalJSON();
            if (set_done) {
              $P('issue_done_ratio').value = 100;
            }
            break;
            
          case 'set_issue_status':
            var issue_status = button.config.get('set_issue_status').evalJSON();
            $P('issue_status_id').value = issue_status.first();
            break;

          case 'include_comment':
            var include_comment = button.config.get('include_comment').evalJSON();
            if (include_comment) {
              //Fix to make this plugin compatible with CKEditor plugin
              if (typeof CKEDITOR != "undefined" && CKEDITOR && CKEDITOR.instances["issue_notes"]) {
                //destroy CKEDITOR so it won't replace notes text with his empty value on submit
                try {
                  CKEDITOR.instances["issue_notes"].destroy()
                } catch(ex) {
                  //nothing to do.
                }
              }
              $P('issue_notes').value = button.up().select('textarea.notes').first().value;
            }
            break;

          case 'include_custom_fields':
            var custom_fields = button.config.get('include_custom_fields').evalJSON();
            custom_fields.each(function(id) {
              var custom_field_id = ['issue_custom_field_values', id].join('_');
              var original_field = $P(custom_field_id);
              var mirrored_field = button.up().select('.' + custom_field_id).first();
              if (mirrored_field && original_field) {
                original_field.value = mirrored_field.value;
              }
            });
            break;
            
          case 'include_standart_fields':
            var standart_fields = button.config.get('include_standart_fields').evalJSON();
            standart_fields.each(function(standart_field_id) {
              var original_field = $P(standart_field_id);
              var mirrored_field = button.up().select('.' + standart_field_id).first();
              if (mirrored_field && original_field) {
                original_field.value = mirrored_field.value;
              }
            });
            break;
            
          case 'include_file_attachment':
            $$P('#issue-form .box fieldset').last().insert(
              $P('attachments_fields').up()
            );
            break;
        }
      });
      
      // Submit issue form!
      $P('issue-form').submit();
    }

  });

  /**
   * Time Tracker Hot Button
   */
  var TimeTrackerButton = Class.create(AbstractHotButton, {

    /**
     * Hot button rendering entry point
     *
     * @param config
     * @return <button /> element
     */
    render: function(config) {
      this.config = new Hash(config);

      // button is not suitable for current context
      if (this.check_conditions() && this.is_workflow_suitable()) {
        return this.render_button();        
      } 

      return false;
    },

    /**
     * Check is current button suitable for current workflow settings
     *
     * @return boolean
     */
    is_workflow_suitable: function() {
      var t = this;
      var suitable = true;
      
      [
        'activity',
        'include_custom_fields'
      ].each(function(option){
        var setting = t.config.get(option);
        if (! setting) return false;
        
        switch(option) {
          case 'activity':
            var activity = t.config.get('activity').evalJSON().first();
            var available_activities = [];
            $$P('#time_entry_activity_id option').each(function(option){
              option.value && available_activities.push(option.value);
            });
            suitable = suitable && -1 < available_activities.indexOf(activity);
            break;
          case 'include_custom_fields':
            var custom_fields = t.config.get('include_custom_fields');
            custom_fields = custom_fields ? custom_fields.evalJSON() : false;
            custom_fields.each(function(custom_field_num){
              var custom_field_id =
                ['time_entry_custom_field_values', custom_field_num].join('_');
              var custom_field = $P(custom_field_id);
              suitable = suitable &&
                (custom_field && ! custom_field.disabled)
            });
            break
        }
        
      });
      return suitable;
    },

    /**
     * Render TimeTracker Hot Button
     *
     * @return <button /> element
     */
    render_button: function() {
      var t = this;
      
      var start_working = new Element('button', {'class': 'action'})
        .update(this.config.get('start'));
      start_working.config = this.config;
      
      Event.observe(start_working, 'click', function(event) {
        t.start_working_action(event, t);
      });

      return start_working;
    },

    start_working_action: function(event, t) {
      var hot_button = Event.element(event);
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.15});
      });
      hot_button.setStyle({opacity: 1});

      var include_seconds = hot_button.config.get('with_seconds');
      include_seconds = include_seconds ? include_seconds.evalJSON() : false;
      var timer_label = new Element('label', {'class': 'timer'});
      var timer_ingredients = [
        new Element('span', {'class': 'hours'}).update('00'),
        new Element('span', {'class': 'minutes_divisor'}).update(':'),
        new Element('span', {'class': 'minutes'}).update('00')
      ];
      var timer_prefix = hot_button.config.get('timer_prefix');
      timer_prefix && timer_ingredients.unshift(
        new Element('span', {'class': 'prefix'}).update(timer_prefix)
      );
      if (include_seconds) {
        timer_ingredients.push(
          new Element('span', {'class': 'seconds_divisor'}).update(':'),
          new Element('span', {'class': 'seconds'}).update('00')
        );
      }
      timer_ingredients.each(function(element){
        timer_label.insert(element);
      });
      timer_label.include_seconds = include_seconds;
      timer_label.config = hot_button.config;
      t.init_timer(timer_label, t);

      var pause_button = new Element('button', {
        'class': 'pause'
      })
        .update(hot_button.config.get('pause'))
        .observe('click', t.pause_button_action);

      var resume_button = new Element('button', {
        'class': 'resume',
        'style': 'display: none;'
      })
        .update(hot_button.config.get('resume'))
        .observe('click', t.resume_button_action);

      var stop_button = new Element('button', {
        'class': 'stop'
      })
        .update(hot_button.config.get('stop'))
        .observe('click', function(event) {
          timer_label.status = 'stop';
          t.finish_action(event, t);
          t.hide_optional();
        });
      stop_button.config = hot_button.config;

      var timer_controls = new Element('div', {
        'class': 'timer_controls'
      })
        .insert(timer_label)
        .insert(pause_button)
        .insert(resume_button)
        .insert(stop_button);

      var optional_controls = new Element('div', {
        'class': 'optional_controls'
      });

      t.get_opt_controls(hot_button.config).each(function(element){
        optional_controls.insert(element);
      });

      var additional_wrapper = new Element('div', {
        'class': 'optional_wrapper'
      })
        .insert(timer_controls)
        .insert(optional_controls);

      var close_button = new Element('a', {
        'class': 'icon_close',
        href: 'javascript:void(0)'
      })
        .observe('click', function(event) {
          timer_label.status = 'stop';
          document.title = timer_label.canonical_page_title;
          t.hide_optional(event);
        })

      var additional_container = new Element('div', {
        id: 'issue_hot_buttons_additional',
        'class': 'time_tracker'
      })
        .insert(new Element('div', {'class': 'controls'}).insert(close_button))
        .insert(additional_wrapper);

      $P('issue_hot_buttons').insert({after: additional_container});
    },
    
    /**
     * Render optional controls
     *
     * @param button_config Hot button configuration
     * @return array Hot buttons array
     */
    get_opt_controls: function(button_config) {
      t = this;
      var elements = [];

      var select_activity_element = this.get_mirrored_element('time_entry_activity_id');
      var activity_selector = select_activity_element.select('select').first();
      // remove "-- Please select --" item
      activity_selector.select('option').first().remove();
      var activity = button_config.get('activity').evalJSON().pop();
      activity_selector.value = activity;
      var select_activity = button_config.get('select_activity');
      select_activity = select_activity ? select_activity.evalJSON() : false;
      if (! select_activity) {
        activity_selector.writeAttribute('disabled', 'disabled')
      }

      elements.push(select_activity_element);

      var custom_fields = button_config.get('include_custom_fields');
      custom_fields = custom_fields ? custom_fields.evalJSON() : false;
      if (custom_fields) {
        custom_fields.each(function(custom_field_id){
          elements.push(t.get_mirrored_element(
            ['time_entry_custom_field_values', custom_field_id].join('_')
          ));
        });
      }

      var include_comment = button_config.get('include_comment');
      include_comment = include_comment ? include_comment.evalJSON() : false;
      if (include_comment) {
        elements.push(t.get_mirrored_element('time_entry_comments'));
      }

      return elements;
    },

    init_timer: function(label, t) {
      var mode = ['run', 'pause', 'stop'];
      label.canonical_page_title = document.title;
      
      var timer_in_title = label.config.get('timer_in_title');
      timer_in_title = timer_in_title ? timer_in_title.evalJSON() : false;
      var title_changed = -1;
      
      label.elapsed = 0;
      label.status = 'run';
      
      window.onbeforeunload = function(e){
        var message = label.config.get('page_close_confirm');
        e = e || window.event;
        if (e) {
          e.returnValue = message;
        }    
        return message;
      }
      
      new PeriodicalExecuter(function(pe) {
        if (0 > mode.indexOf(label.status)) pe.stop();
        if ('stop'  === label.status) {
          window.onbeforeunload = null;
          document.title = label.canonical_page_title;
          pe.stop();
        }
        if ('pause' === label.status) return;

        label.elapsed++;
        
        var hours = Math.floor(label.elapsed / (60 * 60));
        var divisor_for_minutes = label.elapsed % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);
        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);
        
        var s_hours = hours < 10 ? '0'.concat(hours): hours;
        var s_minutes = minutes < 10? '0'.concat(minutes): minutes;
        
        if (timer_in_title && (hours * 60 + minutes) > title_changed) {
          title_changed = hours * 60 + minutes;
          document.title = 
            [[s_hours, s_minutes].join(':'), label.canonical_page_title].join(' ');
        }

        label.select('.hours').first().update(s_hours);
        label.select('.minutes').first().update(s_minutes);
        
        if (label.include_seconds) {
          label.select('.seconds').first().update(seconds < 10? '0'.concat(seconds): seconds);
        }
        else {
          var minutes_divisor = label.select('.minutes_divisor').first();
          if (! minutes_divisor.readAttribute('style')) {
            minutes_divisor.writeAttribute('style', 'visibility: hidden');
          }
          else {
            minutes_divisor.removeAttribute('style');
          }
        }
      }, 1);
    },

    pause_button_action: function(event) {
      var button = Event.element(event);
      button.up().select('button.resume').first().show();
      button.up().select('label.timer').first().status = 'pause';
      button.hide();
    },

    resume_button_action: function(event) {
      var button = Event.element(event);
      button.up().select('button.pause').first().show();
      button.up().select('label.timer').first().status = 'run';
      button.hide();
    },
       
    /**
     * Finish(stop) button action
     *
     * @param event Event object
     * @param t     IssueUpdateButton context
     */
    finish_action: function(event, t){
      var button = Event.element(event); 
      
      var timer = button.up().select('label.timer').first();
      var working_time = timer.elapsed;
      var round_interval = parseInt(t.config.get('round_interval'));
      round_interval = isNaN(round_interval) ? 1 : round_interval;
      round_interval *= 60;
      var module = working_time % round_interval;
      working_time = Math.floor(working_time / round_interval) * round_interval;
      working_time += (module > 0)
        ? round_interval
        : 0;
      
      var working_hours = (working_time / 60 / 60);
      
      var post_data = {
        'time_entry[issue_id]': t.issue.id,
        'time_entry[spent_on]': t.today,
        'time_entry[hours]': working_hours,
        'authenticity_token': $$P('input[name="authenticity_token"]').first().value
      };
      
      var request_url = '/time_entries'; /* ['/projects', t.project.identifier, 'time_entries/new'].join('/'); */
      
      [
        'activity',
        'include_comment',
        'include_custom_fields',
      ].each(function(option){
        if (! t.config.get(option)) return false;
        switch(option) {
          
          case 'activity':
            var activity = t.config.get('activity').evalJSON();
            post_data['time_entry[activity_id]'] = 
              button.up(1).select('select.time_entry_activity_id').first().value;
            break;

          case 'include_comment':
            var include_comment = t.config.get('include_comment').evalJSON();
            if (include_comment) {
              post_data['time_entry[comments]'] = 
                button.up(1).select('input.time_entry_comments').first().value;
            }
            break;

          case 'include_custom_fields':
            var custom_fields = t.config.get('include_custom_fields').evalJSON();
            custom_fields.each(function(id){
              var original_input = $$P('#time_entry_custom_field_values_' + id).last();
              post_data['time_entry[custom_field_values][' + id + ']'] =
                original_input.value;
              var mirrored_input = button.up(1).select('.time_entry_custom_field_values_' + id).last();
              if (mirrored_input.value) {
                post_data['time_entry[custom_field_values][' + id + ']'] =
                  mirrored_input.value;
              }
            });
            break;
        }
      });
     
      // Submit issue form!
      new Ajax.Request(request_url, {
        method: 'post',
        parameters: new Hash(post_data),
        onComplete: function(response) {
          window.onbeforeunload = null;
          window.location.href = window.location.href;
        }
      });
    }
  });
  
  var NextPrevIssueButton = Class.create(AbstractHotButton, {
    
    initialize: function(kind) {
      if (['prev', 'next'].indexOf(kind) < 0)
        throw 'Invalid king of NextPrevIssueButton (' + kind + ')';
      this.kind = kind;
    },
    
    is_workflow_suitable: function() {
      if (! this.nearby_issues) return false;
      if (this.nearby_issues.indexOf(this.issue.id) < 0) return false;
      switch (this.kind) {
        case 'next':
          return this.nearby_issues.indexOf(this.issue.id) < this.nearby_issues.length - 1;
        case 'prev':
          return this.nearby_issues.indexOf(this.issue.id) > 0;
        default:
          return false;
      }
    },
    
    /**
     * Hot button rendering entry point
     *
     * @param config
     * @return <button /> element
     */
    render: function(config) {
      this.config = new Hash(config);

      if (this.is_workflow_suitable()) {
        return this.render_button();
      }

      return false;
    },
    
    render_button: function() {
      var t = this;
      var button = new Element('button', {'class': 'action'})
        .insert(this.config.get('caption'));
      button.config = this.config;
      button.kind = this.kind;
      
      button.observe('click', function(e){
        t.submit_action(e, t);
      });
      
      return button;
    },
    
    submit_action: function(e, t) {
      var button = e.element();
      var position = t.nearby_issues.indexOf(t.issue.id);
      
      switch (button.kind) {
        case 'next':
          position++
          break;
        case 'prev':
          position--
          break;
      }
      
      window.location.href = '/issues/' + t.nearby_issues[position];
    }
    
  });
  

  /**
   * Hot buttons initializer
   */
  var HotButtons = Class.create(IssueHotButtons, {

    /**
     * Constructor.
     * Initialize Issue Hot Buttons
     *
     * @return void
     */
    initialize: function() {
      this.buttons = {
        issue_update: new IssueUpdateButton,
        time_tracker: new TimeTrackerButton,
        next_issue: new NextPrevIssueButton('next'),
        prev_issue: new NextPrevIssueButton('prev')
      };
      this.render_hot_buttons();
    },

    /**
     * Render Hot Buttons block
     *
     * @return void
     */
    render_hot_buttons: function() {
      if (Object.isString(this.settings)) {
        // nothing to do, settings is empty
        return false;
      }

      var buttons = [];
      for (var i in this.settings) {
        var hot_button = this.settings[i];
        var button_type   = new Hash(hot_button).keys().first();
        var button_config = new Hash(hot_button).values().first();
        if ('undefined' == typeof this.buttons[button_type]) {
          // unknown button type
          continue;
        }
        var button = this.buttons[button_type].render(button_config);
        button && buttons.push(button);
      }

      if (0 < buttons.length) {
        // attach hot buttons, if exists
        var hot_buttons_container = new Element('div', {'id': 'issue_hot_buttons'});
        buttons.each(function(element){
          hot_buttons_container.insert(element);
        });
        $$P('div.issue').first().insert({before: hot_buttons_container});
      }
    }

  });

  // Initialize Hot Buttons!
  new HotButtons();

});
 
