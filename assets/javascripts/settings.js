/**
 * Redmine Issue Hot Buttons plugin
 * Settings page
 */

jQuery(document).ready(function() {

  /**
   * Hot Buttons configuration factory.
   * Produce Hot Button settings sections
   */
  var ButtonSettingsFactory = Class.create({

    /**
     * "Next Issue" Hot Button fields frame
     *
     * @return "Next Issue" Hot Button settings frame
     */
    button_next_issue: function() {
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        caption: ['hidden', ''], //'text',
        _callback: {
          caption: {
            focus: this.callback.save_value,
            blur:  this.callback.restore_previous_if_empty
          }
        }
      };
    },
    
    /**
     * "Previous Issue" Hot Button fields frame
     *
     * @return "Previous Issue" Hot Button settings frame
     */
    button_prev_issue: function() {
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        caption: ['hidden', ''], //'text',
        _callback: {
          caption: {
            focus: this.callback.save_value,
            blur:  this.callback.restore_previous_if_empty
          }
        }
      };
    },
    
    /**
     * "Time tracker" Hot Button fields frame
     *
     * @return "Time tracker" Hot Button settings frame
     */
    button_time_tracker: function() {
      var t = this;
      var users_roles = Object.clone(this.user_roles);
      users_roles['current_user'] = '&lt;&lt; ' + this._('current_user') + ' &gt;&gt;';
      users_roles['nobody'] = '&lt;&lt; ' + this._('nobody') + ' &gt;&gt;';
      var check_not_empty = {
        focus: this.callback.save_value,
        blur:  this.callback.restore_previous_if_empty
      }
      
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        start: 'text',
        pause: 'text',
        resume: 'text',
        stop: 'text',
        options: {
          page_close_confirm: 'text',
          timer_prefix: 'text',
          round_interval: 'text',
          with_seconds: 'flag',
          timer_in_title: 'flag',
          activity: ['select', false, this.activities],
          select_activity: 'flag',
          include_custom_fields: ['multiselect', false, this.time_entry_custom_fields],
          include_comment: 'flag',
          _optional: [
            'timer_prefix', 'round_interval', 'with_seconds', 'select_activity',
            'include_custom_fields', 'include_comment', 'timer_in_title'
          ],
          _callback: {
            round_interval: {
              'blur': function(e) {t.callback.integer_validation(e, t)}
            }
          }
        },
        conditions: this.get_conditions(),
        _callback: {
          start: check_not_empty,
          pause: check_not_empty,
          resume: check_not_empty,
          stop: check_not_empty
        }
      };
    },

    /**
     * "Reassign to" Hot Button fields frame
     *
     * @return "Reassign to" Hot Button settings frame
     */
    button_issue_update: function() {
      var users_roles = Object.clone(this.user_roles);
      users_roles['current_user'] = '&lt;&lt; ' + this._('current_user') + ' &gt;&gt;';
      users_roles['nobody'] = '&lt;&lt; ' + this._('nobody') + ' &gt;&gt;';
      
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        caption: ['hidden', ''],
        actions: {
          set_issue_status: ['select', false, this.issue_statuses],
          assign_to_other: ['multiselect', false, users_roles],
          set_done: 'flag',
          include_standart_fields: ['multiselect', false, this.standart_fields],
          include_custom_fields: ['multiselect', false, this.issue_custom_fields],
          include_comment: 'flag',
          set_comment_value: 'text',
          include_file_attachment: 'flag',
          _optional: [
            'set_issue_status','assign_to_other', 'set_done', 
            'include_standart_fields', 'include_custom_fields', 'include_comment',
            'set_comment_value', 'include_file_attachment'
          ],
          _callback: {
            assign_to_other: {
              change: this.callback.assign_to_other_change,
              'element:loaded': this.callback.assign_to_other_change
            }
          }
        },
        conditions: this.get_conditions(),
        _callback: {
          caption: {
            focus: this.callback.save_value,
            blur:  this.callback.restore_previous_if_empty
          }
        }
      }
    },
    
    /**
     * Get common for all buttons conditions subset frame
     *
     * @return Conditions subset
     */
    get_conditions: function() {
      var users_roles = Object.clone(this.user_roles);
      users_roles['current_user'] = '&lt;&lt; ' + this._('current_user') + ' &gt;&gt;';
      users_roles['nobody'] = '&lt;&lt; ' + this._('nobody') + ' &gt;&gt;';
      var t = this;
      return {
        issue_assigned_to: ['multiselect', false, users_roles],
        issue_not_assigned_to: ['multiselect', false, users_roles],
        user_role: ['multiselect', false, this.user_roles],
        user_role_is_not: ['multiselect', false, this.user_roles],
        issue_status: ['multiselect', false, this.issue_statuses],
        issue_status_is_not: ['multiselect', false, this.issue_statuses],
        issue_tracker: ['multiselect', false, this.issue_trackers],
        issue_tracker_is_not: ['multiselect', false, this.issue_trackers],
        project: ['multiselect', false, this.projects],
        project_is_not: ['multiselect', false, this.projects],
        _optional: [
          'issue_assigned_to', 'issue_not_assigned_to', 'user_role',
          'user_role_is_not', 'issue_status', 'issue_status_is_not', 
          'issue_tracker', 'issue_tracker_is_not', 'project', 'project_is_not'
        ],
        _shared_names: true,
        _callback: {
          issue_assigned_to: {
            change: function(e){ t.callback.inverted_list(e, t, 'issue_not_assigned_to'); }
          },
          issue_not_assigned_to: {
            change: function(e){ t.callback.inverted_list(e, t, 'issue_assigned_to'); }
          },
          user_role: {
            change: function(e) { t.callback.inverted_list(e, t, 'user_role_is_not'); }
          },
          user_role_is_not: {
            change: function(e) { t.callback.inverted_list(e, t, 'user_role'); }
          },
          issue_status: {
            change: function(e) { t.callback.inverted_list(e, t, 'issue_status_is_not'); }
          },
          issue_status_is_not: {
            change: function(e) { t.callback.inverted_list(e, t, 'issue_status'); }
          },
          issue_tracker: {
            change: function(e) { t.callback.inverted_list(e, t, 'issue_tracker_is_not'); }
          },
          issue_tracker_is_not: {
            change: function(e) { t.callback.inverted_list(e, t, 'issue_tracker'); }     
          },
          project: {
            change: function(e) { t.callback.inverted_list(e, t, 'project_is_not'); }              
          },
          project_is_not: {
            change: function(e) { t.callback.inverted_list(e, t, 'project'); }
          }
        }
      };
    },
    
    /**
     * Elements callbacks storage
     */
    callback: {

      /**
       * Convert mutliselect to select if "current_user" or "nobody" selected
       */
      assign_to_other_change: function(e) {
        var select = e.element();
        var multiple = true;
        select.select('option:selected').each(function(option){
          multiple = multiple && -1 === ['current_user', 'nobody'].indexOf(option.value)
        });
        
        if (multiple) {
          select.writeAttribute('multiple', 'multiple');
        }
        else {
          select.removeAttribute('multiple');
          select.value = select.select('option:selected').last().value;
        }
      },

      /**
       * Validate positive number
       */
      integer_validation: function(e, t) {
        var input = e.element();
        var numbers = '';
        for (var i = 0; i < input.value.length; i++) {
          if (-1 < t.charcodes.numbers.indexOf(input.value.charCodeAt(i))) {
            numbers = numbers.concat(input.value[i]);
          }
        };
        input.value = numbers.length
          ? parseInt(numbers)
          : '';
      },
      
      inverted_list: function(e, t, pair) {
        var element = e.element();
        var pair = element.up(1).select('.' + pair).first();
        if (pair) {
          element.select('option:selected').each(function(option){
            var pair_option =
              pair.select('option:selected[value="' + option.value + '"]').first();
            if (pair_option) {
              pair_option.selected = false;
            }
          });
        }
      },
      
      save_value: function(e) {
        var element = e.element();
        element.prev_value = element.value;
      },
      
      restore_previous_if_empty: function(e) {
        var element = e.element();
        if (! element.value.strip().length) {
          element.value = element.prev_value;
        }
      }
      
    },
    
    /**
     * Charcodes storage. Filled up in initialize()
     */
    charcodes: {
      numbers: []
    },
    
    /**
     * ButtonSettingsFactory Constructor
     */
    initialize: function() {
      for (var i = 48; i <= 57; i++) this.charcodes.numbers.push(i);
    },
    
    /**
     * Get hot button config by name
     *
     * @param  name   Hot Button name
     * @param  params Saved button configuration
     *
     * @return Hot Button settings section
     */
    get: function(button_name, params) {
      if (Object.isFunction(this['button_' + button_name])) {
        var button_frame = this['button_' + button_name](params);


        var config_section_name = !Object.isUndefined(params) &&
          ! Object.isUndefined(params.internal_name) &&
          params['internal_name'].strip();
          
        var caption = Object.isUndefined(button_frame['caption']) ? 
        params['internal_name'] : params['caption'];

        return this.wrap_button(
          button_name,
          this.render_form(button_name, button_frame, params),
          config_section_name || this._(button_name),
		  caption || this._(button_name)
        );
      }
      return false;
    },

    /**
     * Wrap Hot Button settings section to li with common elements
     * like Title, Description and section config controls
     *
     * @param  button_name         Hot Button name
     * @param  button              Nake hot button config fields
     * @param  config_section_name Hot button internal name
     *
     * @return Complete Hot Button settings section
     */
    wrap_button: function(button_name, button, config_section_name, button_caption) {
      var t = this;

      var delete_button = new Element('a', {
        'class': 'icon-del icon',
        href: 'javascript:void(0)'
      }).insert(this._('delete'));

      Event.observe(delete_button, 'click', function(event){
        Event.element(event).up(1).remove();
      })

      var config_section_title = new Element('a',{
        'class': 'collapse_section internal_name',
        href: 'javascript:void(0)'
      }).update(button_caption);
      //  .update(config_section_name);

      Event.observe(config_section_title, 'click', function(event){
        var config_section = Event.element(event).up('.hot_button');
        if (config_section.hasClassName('collapsed')) {
          config_section.removeClassName('collapsed');
        }
        else {
          config_section.addClassName('collapsed');
        }
      })

      var internal_name_input = new Element('input', {
        type: 'text',
        'class': 'internal_name',
        value: button_caption //config_section_name
      }).hide();
      
      var save_internal_name_callback = function(event){
        var wrapper = Event.element(event).up();

        var button_save = wrapper.select('a.save_internal_name').first();
        var button_edit = wrapper.select('a.edit_internal_name').first();
        var name_input = wrapper.select('input.internal_name').first();
        var name_link = wrapper.select('a.internal_name').first();

        button_edit.show();
        name_input.hide();
        button_save.hide();
        name_link.show();

        var internal_name_value = name_input.value.strip();
        name_link.update(internal_name_value);

        button_save.up(1).select('input[xname="internal_name"]')
          .first()
          .value = internal_name_value;
          
        var caption_wrapper = button_save.up(1).select('input[xname="caption"]');
        if (!Object.isUndefined(caption_wrapper)) {
	        caption_wrapper.first().value = internal_name_value;
        }
      };
      
      Event.observe(internal_name_input, 'blur', save_internal_name_callback);
      
      var edit_internal_name = new Element('a', {
        'class': 'icon-edit icon edit_internal_name',
        href: 'javascript:void(0)'
      }).insert(this._('rename'));
      
      var edit_internal_name_callback = function(event){
        var button_edit = Event.element(event);
        var wrapper = button_edit.up();

        var button_save = wrapper.select('a.save_internal_name').first();
        var name_input = wrapper.select('input.internal_name').first();
        var name_link = wrapper.select('a.internal_name').first();

        name_input.value = name_link.innerHTML;

        button_save.show();
        name_input.show().focus();

        button_edit.hide();
        name_link.hide();
      };
      
      Event.observe(edit_internal_name, 'click', edit_internal_name_callback);
      edit_internal_name.click = edit_internal_name_callback;

      var save_internal_name = new Element('a', {
        'class': 'icon-save icon save_internal_name',
        href: 'javascript:void(0)'
      })
        .insert(this._('save'))
        .hide();

      Event.observe(save_internal_name, 'click', save_internal_name_callback);
      
      var clone_hot_button = new Element('a', {
        'class': 'icon-copy icon clone_hot_button',
        href: 'javascript:void(0)'
      }).insert(this._('clone'));
      
      var elements = [
        new Element('p', {'class': 'title'})
          .insert(config_section_title)
          .insert(internal_name_input)
          .insert(save_internal_name)
          .insert(edit_internal_name)
          .insert(clone_hot_button)
          .insert(delete_button),

        new Element('p', {'class': 'description'})
          .insert(this._([button_name, 'description'])),

        button
      ];

      var wrapper = new Element('li')
        .addClassName('hot_button')
        .addClassName(button_name);

      elements.each(function(item) {
        wrapper.insert(item);
      });

      return wrapper;
    },

    /**
     * Render Hot Button configuration inputs group
     *
     * @param  button_name  Hot button name
     * @param  button_frame Hot button structure
     * @param  params       Hot button saved params
     *
     * @return Hot button settings form
     */
    render_form: function(button_name, button_frame, params) {
      return this.render_group(
        button_name,
        button_frame,
        new Element('div',{'class': 'fields'}),
        new Hash(params));
    },

    /**
     * Render inputs group and wrap it
     *
     * @param  button_name  Hot button name
     * @param  inputs_group Inputs group object
     * @param  wrap_element Wrapper for button
     * @param  params       Hot button saved params
     *
     * @return Rendered inputs_group wrapped by wrap_element
     */
    render_group: function(button_name, inputs_group, wrap_element, params) {
      var t = this;

      inputs_group = new Hash(inputs_group);

      var optional_fields = inputs_group.get('_optional') || [];
      var callback = inputs_group.get('_callback') || {};
      var shared_names = inputs_group.get('_shared_names') || false;

      inputs_group.each(function(pair){
        // ignore service keys that starts with underscore, like "_optional"
        if (! pair.key.indexOf('_')) return false;

        var input_name    = pair.key;
        var input_options = pair.value;

        if (! Object.isString(input_options) && ! Object.isArray(input_options)) {
          var sub_wrapper = new Element('fieldset', {
            'class': 'subset'
          });

          var legend = false;
          if (legend = t._([button_name, input_name, 'subset'], false)) {
            sub_wrapper.insert(
              new Element('legend').insert(legend)
            );
          }

          t.render_group(button_name, input_options, sub_wrapper, params);
          wrap_element.insert(sub_wrapper);
        }
        else {
          if (! Object.isArray(input_options)) input_options = [input_options];
          var input_type  = input_options.shift();
          var input_value = input_options.shift();
          input_value = params.get(input_name) || input_value;
          var default_value = input_options.shift();
          // special input params like "_optional"
          var service_params = new Hash();
          if (optional_fields.indexOf(input_name) != -1) {
            service_params.set('_optional', true);
          }
          if (callback[input_name]) {
            service_params.set('_callback', callback[input_name]);
          }

          wrap_element.insert(
            t.render_input(
              shared_names ? '' : button_name,
              input_type,
              input_name,
              input_value,
              default_value,
              service_params
            )
          );

        }
      });
      
      return wrap_element;
    },

    /**
     * Render single input
     *
     * @param  input_type  Input type
     *  Available types:
     *   - text
     *   - select
     *   - multiselect
     *   - flag
     *   - hidden
     * @param  input_name
     * @param  inpulistt_value
     * @param  default_value
     * @param  service_params
     *
     * @return Sigle input for hot button settings form
     */
    render_input: function(button_name, input_type, input_name, input_value, default_value, service_params) {
      var input_element = null;
      var no_label = false;

      var isOptional = service_params.get('_optional');
      var callback  = service_params.get('_callback');
      
      switch (input_type) {
        case 'hidden':
          input_element = new Element('input', {
            xname: input_name,
            type:  'hidden',
            value: input_value
          });
          no_label = true;
          break;

        case 'select':
        case 'multiselect':
          var multiselect = 'multiselect' == input_type;
          
          input_value = input_value.toString();
          input_value = input_value.isJSON() ? input_value.evalJSON() : input_value;
          
          var select = new Element('select', {'class': input_name})
            .addClassName(isOptional ? 'optional' : '')
            .addClassName(input_value.length ? '' : 'no_value');

          if (multiselect) {
            select.setAttribute('multiple', 'multiple');
            new Hash(default_value).each(function(pair){
              var option_element = new Element('option', {
                value: pair.key,
                name: false
              }).insert(pair.value);
              
              if (Object.isArray(input_value) && input_value.indexOf(pair.key) !== -1) {
                option_element.setAttribute('selected', 'selected')
              }
              select.insert(option_element);
            });
          }
          else {
            new Hash(default_value).each(function(pair){
                select.insert(
                  new Element('option', {value: pair.key,name: false})
                    .insert(pair.value)
              );
            });
            select.value = Object.isArray(input_value) ? input_value.pop() : input_value;
          }
          
          input_element =  [
            select,
            new Element('input', {xname: input_name, type: 'hidden'})
          ];
          
          break;

        case 'flag':
          var is_undefined = Object.isUndefined(input_value);
          input_element = [
            new Element('input', {
              xname: input_name,
              type: 'hidden',
              value: 0
            }),
            new Element('input', {
              xname: input_name,
              'class': input_name,
              type: 'checkbox',
              value: 1
            })
              .addClassName(isOptional ? 'optional' : '')
              .addClassName(parseInt(input_value) ? '' : 'no_value')
          ];
          
          if ((is_undefined && default_value) || (!is_undefined && parseInt(input_value) !== 0)) {
            input_element.last().setAttribute('checked', 'checked')
          }
          break;

        default:
        case 'text':
          var is_no_value = Object.isUndefined(input_value) || ! input_value;

          input_value = input_value || default_value || (this._([button_name, input_name, 'value'], false) || input_value);
          input_element = new Element('input', {
            xname: input_name,
            'class': input_name,
            type: 'text',
            value: input_value || ''
          })
            .addClassName(isOptional ? 'optional' : '')
            .addClassName(is_no_value ? 'no_value' : '');
      }

      var result = new Element('div', {'class': 'input_wrapper'})
        .insert(no_label || new Element('label').insert(this._([button_name, input_name, 'label'])));

      input_element = Object.isArray(input_element) ? input_element : [input_element];
      input_element.each(function(element){
        if (callback && 'hidden' !== element.type) {
          callback = new Hash(callback);
          callback.each(function(pair){
            var event_name = pair.key;
            var event_callback = pair.value;
            element.observe(event_name, event_callback);
            if ('element:loaded' == event_name) {
              Event.fire(element, 'element:loaded');
            }
          });
        }
        result.insert(element);
      });

      if (isOptional) {
        var delete_button = new Element('a', {
          'class': 'icon-move icon',
          href: 'javascript:void(0)'
        }).insert(this._('Remove'));

        t = this;

        Event.observe(delete_button, 'click', function(event){
          var optional_field = Event.element(event).up().select('.optional').first();
          t.hide_optional_field(optional_field);
          t.sort_select(optional_field.up(1).select('select.optional_fields').first());
        });


        result.insert(delete_button);
      }

      return result;
    },

    /**
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key i18n ID
     * @param  get_back Get back i18n ID if translation not exists
     *
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });


  /**
   * Translator
   */
  var Translator = Class.create({
    /**
     * Constructor.
     * Initialize translator
     *
     * @param  i18n strings class object
     *
     * @return void
     */
    initialize: function(i18n_strings) {
      this.i18n_strings = new Hash(i18n_strings);
    },

    /**
     * Translate string using IssueHotButtonsSettings locale strings store
     *
     * @param  key i18n identifier
     * @param  get_back Get back i18n ID if translation not exists
     *
     * @return Translated string or input key if translation not found
     */
    get: function(key, get_back) {
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    }
  });

  /**
   * Settings page
   */
  var Settings = Class.create(IssueHotButtonsSettings, {

    /**
     * Available Hot Buttons
     * next_issue and prev_issue buttons disabled, since they are built-in for Redmine now
     */
    available_buttons: [
      'time_tracker',
      'issue_update',
      'next_issue',
      'prev_issue'
    ],

    /**
     * Constructor.
     * Initialize settings page
     *
     * @return void
     */
    initialize: function() {
      this.buttons_factory = new ButtonSettingsFactory();

      this.translator = this.buttons_factory.translator = new Translator(this.i18n_strings);

      // Assign custom fields to ButtonSettingsFactory
      this.buttons_factory.issue_custom_fields = this.issue_custom_fields;
      this.buttons_factory.time_entry_custom_fields = this.time_entry_custom_fields;
      this.buttons_factory.standart_fields = this.standart_fields;
      this.buttons_factory.issue_statuses = this.issue_statuses;
      this.buttons_factory.issue_trackers = this.issue_trackers;
      this.buttons_factory.user_roles = this.user_roles;
      this.buttons_factory.activities = this.activities;
      this.buttons_factory.projects = this.projects;
      
      this.render_selector();
      this.modify_form_controls();
      this.load_saved_buttons();

      $$P('input[name="commit"]').first().observe('click', this.attach_input_names);
    },

    /**
     * Render to page exists configured Hot Buttons
     *
     * @return void
     */
    load_saved_buttons: function() {
      if (Object.isUndefined(this.settings)) return false;

      // Create buttons list, if not exists
      if ($P('buttons_list') == null) {
        $P('hot_buttons_settings').appendChild(new Element('ul', {id: 'buttons_list'}));
      }

      var t = this;
      new Hash(this.settings).values().each(function(button_config){
        var button_config = new Hash(button_config);
        var name = button_config.keys().first();
        var params = button_config.values().first();

        var button = t.render_button(name, params, true);
        $P('buttons_list').insert(button);
        t.hide_optional_fields(button);
      });
      this.init_sortable_list();
    },

    /**
     * Make buttons list sortable
     *
     * @return void
     */
    init_sortable_list: function() {
/*      Sortable.create('buttons_list', {
        tag:'li',
        onChange: function(){}
      });
	  */
 	  jQuery('#buttons_list').sortable().disableSelection(); 
    },

    /**
     * Callback invoked before settings form submitted
     *
     * @param  e Event object
     *
     * @return void
     */
    attach_input_names: function() {
      var button_number = 0;
      $$P('li.hot_button').each(function(li){
        var collapsed = li.hasClassName('collapsed');
        if (collapsed) {
          li.removeClassName('collapsed');
        }
        var sortable = li.hasClassName('ui-sortable-handle')
        if (sortable) {
	        li.removeClassName('ui-sortable-handle');
        }

        var button_type = li.classNames().toArray().pop();

        li.select('.input_wrapper input').each(function(element){
          if (! element.up().visible()) return;

          var xname = element.readAttribute('xname');
          var name = [button_number, button_type, xname].join('][');
          name = 'settings[' + name + ']';
          element.setAttribute('name', name);
        });
        
        li.select('.input_wrapper select').each(function(select){
          if (! select.up().visible()) return;

          var values = [];
          if (select.hasAttribute('multiple')) {
            select.select('option:selected').each(function(option){
              values.push(option.value);
            });
          }
          else {
            values.push(select.value);
          }
          select.up().select('input').first().value = Object.toJSON(values);
        });

        if (collapsed) {
          li.addClassName('collapsed');
        }
        button_number++;
      });
    },

    /**
     * Render to page "Add Hot Button" select
     *
     * @return void
     */
    render_selector: function() {
      var t = this;

      var wrapper = new Element('div', {id: 'hot_buttons_selector_wrapper'});

      var label = new Element('label', {'for': 'hot_buttons_selector'})
        .insert(this._('select_hot_button'));
      wrapper.insert(label);

      var select = new Element('select', {id: 'hot_buttons_selector'});
      var buttons = this.available_buttons;
      buttons.unshift(false);
      buttons.each(function(button_id){
        var option = new Element('option', {
          value: button_id
        }).insert(t._(button_id));
        select.appendChild(option);
      });
      wrapper.appendChild(select);

      var collapse_button = new Element('a',{
        'href': 'javascript:void(0)',
        'class': 'icon icon-folder'
      })
        .update(this._('collapse_all'))
        .observe('click', function(){
          $$P('#buttons_list li.hot_button').each(function(hot_button){
            hot_button.hasClassName('collapsed')
              ? false
              : hot_button.addClassName('collapsed');
          });
        });
      var expand_button = new Element('a',{
        'href': 'javascript:void(0)',
        'class': 'icon open icon-folder'
      })
        .update(this._('expand_all'))
        .observe('click', function(){
          $$P('#buttons_list li.hot_button').each(function(hot_button){
            hot_button.removeClassName('collapsed');
          });
        })
        .wrap('span', {'class': 'open'});
      var collapse_controls = new Element('div', {'class': 'collapse_expand'})
        .insert(collapse_button)
        .insert(expand_button);
      wrapper.insert(collapse_controls);

      Event.observe(select, 'change', function(){
        var button_name = $P('hot_buttons_selector').value;
        if (button_name.length == 0) return false;

        $$P('#hot_buttons_selector option').first().selected = true;

        var button = t.render_button(button_name, false, false, 'top');
        $P('buttons_list').insert({'top': button});
        t.hide_optional_fields(button);
        var edit_name = button.select('.edit_internal_name').first();
        edit_name.click(edit_name.fire('click'));
        t.init_sortable_list();
      });

      $P('hot_buttons_settings').appendChild(wrapper);
    },
    
    modify_form_controls: function() {
      var save_button = $$P('input[name="commit"]').first();
      save_button.value = this._('save');
      var cancel_button = new Element('input', {
        type: 'button',
        value: this._('cancel')
      })
        .observe('click', function(e){
          window.location.reload();
        });
      save_button.insert({after: cancel_button});
    },

    /**
     * Render Hot Button
     *
     * @return void
     */
    render_button: function(button_name, params, collapsed) {
      var t = this;

      var button = this.buttons_factory.get(button_name, params)
      if (button && collapsed) {
        button.addClassName('collapsed');
      }
      if (! button) return;
      
      button.select('.clone_hot_button')
        .first()
        .observe('click', function(event){
          t.clone_button(event, t);
        });
      
      return button;
    },
    
    /**
     * Clone hot button
     */
    clone_button: function(event, t) {
      t.attach_input_names();
      var source = event.element().up(1);
      source.hasClassName('collapsed') || source.addClassName('collapsed');
      var clone_type = source.classNames().toArray()[1];
      var clone_config = {};
      source.select('input').each(function(input){
        if(input.up().visible()) {
          clone_config[input.readAttribute('xname')] = input.value;
        }
      });
      var clone = t.render_button(clone_type, clone_config);
      
      var name_link = clone.select('a.internal_name').first();
      name_link.update([name_link.innerHTML, t._('clone')].join(' '));
      var name_input = clone.select('input.internal_name').first();
      name_input.value = [name_input.value, t._('clone')].join(' ');
      
      var rename_link = clone.select('a.edit_internal_name').first();
      
      t.hide_optional_fields(clone);
      source.insert({after: clone});
      rename_link.click(rename_link.fire('click'));
      t.init_sortable_list();
    },

    hide_optional_fields: function(button) {
      if (! button) return;
      t = this;
      button.select('.optional.no_value').each(function(field){
        t.hide_optional_field(field)
      });
      button.select('select.optional_fields').each(function(select){
        t.sort_select(select);
      });
    },
    
    sort_select: function(select) {
      var labels = [];
      var options = {};
      select.select('option').each(function(option){
        labels.push(option.value);
        options[option.value] = option;
      });
      labels = labels.sort();
      select.select('option').each(function(option){
        option.remove();
      });
      labels.each(function(label){
        select.insert(options[label]);
      });
      select.value = 0;
    },
    
    hide_optional_field: function(field){
      t = this;

      var label_text = field.siblings().first().innerHTML;
      var element_name = field.classNames().toArray().first();

      var field_wrapper = field.up();
      var field_container = field_wrapper.up();

      var optional_fields_select = null;
      if (! field_container.select('select.optional_fields').length) {
        optional_fields_select = new Element('select', {
          'class': 'optional_fields'
        }).insert(new Element('option'));

        Event.observe(optional_fields_select, 'change', function(event){
          var optional_select = Event.element(event);
          var button_name = optional_select.value;
          if (button_name.length == 0) return false;
          var optional_field = optional_select.up(1).select('.' + button_name).first().up();
          optional_field.show();
          if (optional_field.select('input[type="checkbox"]').length) {
            optional_field.select('input[type="checkbox"]').first().checked = true;
          }

          var option = optional_select.select('option[value="' + button_name + '"]').first();
          option.remove();
          if(optional_select.select('option').length == 1) {
            optional_select.up().hide();
          }
        });

        field_container.insert({
          top: new Element('div', {'class': 'optional_elements_selector'})
            .insert(new Element('label').update(this._('select_hidden_elements')))
            .insert(optional_fields_select)
        })
      }
      else {
        optional_fields_select = field_container.select('select.optional_fields').first();
      }
      optional_fields_select.insert(
        new Element('option', {value: element_name}).update(label_text)
      );
      optional_fields_select.up().show();  

      field_wrapper.hide();
    },

    /**
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key      i18n ID
     * @param  get_back Get back i18n ID if translation not exists
     * 
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });

  // Initialize settings page!
  new Settings();
});