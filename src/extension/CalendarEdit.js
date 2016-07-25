/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Calendar编辑控件
 * @author weifeng(weifeng@baidu.com)
 */
define(
    function (require) {
        var u = require('underscore');
        var Calendar = require('../Calendar');
        var Extension = require('../Extension');
        var eoo = require('eoo');
        var esui = require('esui');

        var lib = require('../lib');
        var moment = require('moment');

        var copyStatus = ['rawValue', 'disabled', 'readOnly', 'hidden'];

        var Rule = require('../validator/Rule');
        var ValidityState = require('../validator/ValidityState');

        /**
         * 最小值验证规则
         *
         * @extends validator.Rule
         * @class validator.DateRangeRule
         * @constructor
         */
        var DateRangeRule = eoo.create(
            Rule,
            {
                /**
                 * 规则类型，始终为`"dateRange"`
                 *
                 * @type {string}
                 * @override
                 */
                type: 'dateRange',

                /**
                 * 验证控件的验证状态
                 *
                 * @param {string} value 校验值
                 * @param {Control} control 待校验控件
                 * @return {validator.ValidityState}
                 * @override
                 */
                check: function (value, control) {
                    var validate = true;
                    var errorMessage = '';
                    var range = control.range;
                    if (!moment(value, control.paramFormat).isValid()) {
                         errorMessage = '输入格式错误';
                        validate = false;
                    }
                    else {
                        if (range) {
                            var rangeBegin = moment(range.begin);
                            var rangeEnd = moment(range.end);
                            var currentDate = moment(value);
                            if (!(currentDate.diff(rangeBegin) >= 0)
                                || !(currentDate.diff(rangeEnd) <= 0)) {
                                validate = false;
                                errorMessage = '请输入有效范围内的时间';
                            }
                        }
                    }
                    return new ValidityState(
                        validate,
                        errorMessage
                    );
                }
            }
        );

        esui.registerRule(DateRangeRule, 300);

        /**
         * 日历编辑扩展
         *
         * 当日历添加此拓展以后，可以通过输入框来输入具体的日期
         *
         *  1. 复写掉initStructure，来插入的输入框
         *  2. 复写getValidationResult进行格式验证以及range验证
         *  3. rawValue，以及禁用，只读等状态的切换更改
         * @class extension.CalendarEdit
         * @extends Extension
         * @constructor
         */
        var CalendarEdit = eoo.create(
            Extension,
            {

                /**
                 * 指定扩展类型，始终为`"CalendarEdit"`
                 *
                 * @type {string}
                 */
                type: 'CalendarEdit',

                /**
                 * 激活扩展
                 *
                 * @override
                 */
                activate: function () {
                    var target = this.target;
                    // 只对`Calendar`控件生效
                    if (!(target instanceof Calendar)) {
                        return;
                    }

                    // 对一批方法的复写
                    target.initStructure = u.bind(initStructure, target);
                    target.initEvents = u.bind(initEvents, target);

                    // 添加一个校验
                    target.dateRange = true;

                    this.$super(arguments);
                },

                /**
                 * 取消扩展的激活状态
                 *
                 * @override
                 */
                inactivate: function () {
                    // 只对`Calendar`控件生效
                    if (!(this.target instanceof Calendar)) {
                        return;
                    }

                    u.unbind(initStructure, target);
                    u.unbind(initEvents, target);
                    target.dateRange = false;

                    this.helper.removePartClasses('input');
                    this.helper.disposeChildren();

                    this.$super(arguments);
                }
            }
        );

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        function initStructure() {
            // 如果主元素是输入元素，替换成`<div>`
            // 如果输入了非块级元素，则不负责
            var controlHelper = this.helper;
            if (lib.isInput(this.main)) {
                controlHelper.replaceMain();
            }

            var template = [
                '<div class="${classes}">',
                    '<div data-ui="type:TextBox;childName:calendarInput;width:130;"></div>',
                '</div>'
            ];

            this.layer.autoCloseExcludeElements = [this.main];
            this.main.innerHTML = lib.format(
                template.join(''),
                {
                    classes: controlHelper.getPartClassName('textbox'),
                    arrow: controlHelper.getPartClassName('arrow')
                }
            );

            controlHelper.addPartClasses('input');

            controlHelper.initChildren();

            // 第一次的rawValue赋值监听不到，需要手动触发一次
            initExtendsionOptions.call(this);
        }

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        function initEvents() {
            // 输入框的时候，变为hover聚焦更好一点
            var calendarInput = this.getChild('calendarInput');
            calendarInput.on('focus', u.bind(this.layer.show, this.layer));

            this.on('change', u.bind(syncTextBox, this));
            calendarInput.on('input', u.bind(syncMonthView, this));

            // 需要监听property
            this.on('propertyset', u.bind(syncControlRepainter, this));
        }

        /**
         * 更新输入框的值
         *
         * @event
         * @param {Object} e 事件对象
         * @ignore
         */
        function syncTextBox(e) {
            var calendar = this;
            setTextBoxProperties.call(this, {
                rawValue: calendar.getRawValue()
            });
        }

        /**
         * 更新日历的值
         *
         * @event
         * @param {Object} e 事件对象
         * @ignore
         */
        function syncMonthView(e) {
            var currTextBox = e.target;
            var date = currTextBox.getRawValue();
            if (!date) {
                return;
            }

            if (moment(date, this.paramFormat).isValid()) {
                this.setProperties({
                    rawValue: moment(date).toDate()
                });
            }
        }

        /**
         * 需要去监听properties changes来实现拓展状态属性的切换
         * @param {Object} e 事件对象
         * @ignore
         */
        function syncControlRepainter(e) {
            var changes = e.changes;
            if (changes.length) {
                var properties = {};
                u.each(changes, function(change) {
                    if (u.contains(copyStatus, change.name)) {
                        properties[change.name] = change.newValue;
                    }
                });
                setTextBoxProperties.call(this, properties);
            }
        }

        /**
         * 初始化输入框的的value以及各种状态值
         * 因为initOptions生命周期在initExtensions之前，所以需要手动触发一次
         * @ignore
         */
        function initExtendsionOptions() {
            setTextBoxProperties.call(this, u.pick(this, copyStatus));
        }

        /**
         * 设置输入框的属性
         * 如果当前输入框获取焦点则认为该行为由输入框触发，不进行任何处理
         * @param {Object} properties 待设置的属性
         * @ignore
         */
        function setTextBoxProperties(properties) {
            var calendarInput = this.getChild('calendarInput');
            var value = properties.rawValue;
            if (value) {
                properties.rawValue = moment(value).format(this.displayFormat);
            }
            // 是否是当前textbox激活
            var currentElement = document.activeElement;
            if (currentElement && currentElement !== calendarInput.getFocusTarget()) {
                calendarInput.setProperties(properties);
            }
        }

        esui.registerExtension(CalendarEdit);
        return CalendarEdit;
    }
);
