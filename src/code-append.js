
{
    const _ri18n = require("react-i18next");
    const _i18n = _ri18n.getI18n();
    const globalI18N = require('i18next').default;
    _i18n.options.lng = 'editor';
    _i18n.options.fallbackLng = ['editor'];
    _i18n.options.resources = {
        editor: {
            [_i18n.options.defaultNS || 'translation']: '{{RESOURCES}}'
        },
    };
    const newI18N = globalI18N
        .init(_i18n.options)
    _ri18n.setI18n(newI18N);
    setTimeout(() => {
        _i18n.changeLanguage('editor');
    }, 0);
}