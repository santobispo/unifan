/**
 * URL base da API (Spring Boot).
 * Altere `apiBaseUrl` se o backend mudar de ambiente.
 */
(function (global) {
  global.VendasApp = global.VendasApp || {};
  global.VendasApp.config = {
    apiBaseUrl: 'https://backend-vendas-start-vzpw.onrender.com',
  };

  global.VendasApp.getApiBaseUrl = function () {
    return String(global.VendasApp.config.apiBaseUrl || '').replace(/\/$/, '');
  };

  global.VendasApp.setApiBaseUrl = function (url) {
    global.VendasApp.config.apiBaseUrl = String(url || '').replace(/\/$/, '');
  };
})(typeof window !== 'undefined' ? window : globalThis);
