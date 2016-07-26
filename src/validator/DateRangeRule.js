/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 必填项验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');
        var eoo = require('eoo');
        var esui = require('../main');
        var moment = require('moment');

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
        return DateRangeRule;
    }
);
