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

        /**
         * 日历编辑扩展
         *
         * 当日历添加此拓展以后，可以通过输入框来输入具体的日期
         *
         * TODO: 
         *  1. 复写掉initStructure，来插入的输入框
         *  2. 添加时间格式验证，失去焦点(不报错，但是不起错用，抛出错误？)或者提交的时候进行格式验证getValidationResult
         *  3. 对range的范围校验
         *  4. 禁用和只读的情况
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

                    // 复写initStructure
                    target.initStructure = u.bind(initStructure, target);
                    target.initEvents = u.bind(initEvents, target);

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

                    target.initStructure = u.unbind(initStructure, target);
                    target.initEvents = u.unbind(initEvents, target);

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

            this.layer.autoCloseExcludeElements = [this.main];
            var template = [
                '<div class="${classes}">',
                    '<div data-ui="type:TextBox;childName:input;"></div>',
                '</div>',
                '<div class="${arrow}"><span class="${iconCalendar}"></span></div>'
            ];

            this.main.innerHTML = lib.format(
                template.join(''),
                {
                    classes: controlHelper.getPartClassName('text'),
                    arrow: controlHelper.getPartClassName('arrow'),
                    iconCalendar: controlHelper.getIconClass()
                }
            );

            controlHelper.initChildren();
        }

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        function initEvents() {
            this.helper.addDOMEvent(this.main, 'click', u.bind(this.layer.toggle, this.layer));

            this.on('change', u.bind(syncMonthView, this));
            this.getChild('input').on('input', u.bind(syncTextBox, this));
        }

        /**
         * 更新显示
         *
         * @event
         * @fires Calendar#change
         * @param {Object} e 事件对象
         * @param {MonthView} e.target 当前改变值的MonthView控件
         * @ignore
         */
        function syncMonthView(e) {
            var calendar = this;
            var calendarTextBox = calendar.getChild('input');
            var currentElement = document.activeElement;
            if (currentElement && currentElement !== calendarTextBox.getFocusTarget()) {
                calendarTextBox.setProperties({
                    rawValue: u.escape(
                        moment(calendar.getRawValue()).format(calendar.displayFormat)
                    )
                });
            }
        }

        /**
         * 更新输入框的值
         *
         * @event
         * @fires Calendar#change
         * @param {Object} e 事件对象
         * @param {MonthView} e.target 当前改变值的MonthView控件
         * @ignore
         */
        function syncTextBox(e) {
            var currTextBox = e.target;
            var date = currTextBox.getRawValue();
            if (!date) {
                return;
            }

            var rangeBegin = moment(this.range.begin, this.paramFormat);
            var rangeEnd = moment(this.range.end, this.paramFormat);
            var currentDate = moment(date, this.paramFormat);
            // ?bug
            if (currentDate.isValid()
                && currentDate.diff(rangeBegin) >= 0
                && currentDate.diff(rangeEnd) >= 0
            ) {
            // if (/^(\d{1,4})(-|.|\/)(\d{1,2})\2(\d{1,2})$/.test(date)) {
                if (moment(date, this.paramFormat).isValid()) {
                    this.setProperties({
                        rawValue: moment(date).toDate() || ''
                    });
                }
            // }
            }
        }

        function validateDate(date) {

        }

        esui.registerExtension(CalendarEdit);
        return CalendarEdit;
    }
);
