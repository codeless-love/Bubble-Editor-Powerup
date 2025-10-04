console.log("❤️" + "Styles Drag Rearrange - MAIN WORLD script");

(function() {
  const MAIN_WORLD_SOURCE = 'main-world-script';
  const ISOLATED_WORLD_SOURCE = 'isolated-world-script';
  const SAVE_TOKEN_ACTION = 'saveColorTokenOrder';
  const SAVE_RESULT_ACTION = 'saveColorTokenOrderResult';
  const INITIAL_TOKEN_ACTION = 'initialColorTokens';
  const REQUEST_TOKEN_ACTION = 'requestInitialColorTokens';
  const MAX_APPQUERY_ATTEMPTS = 10;
  const APPQUERY_RETRY_DELAY = 500;

  function getAppqueryRoot() {
    if (typeof window.appquery === 'function') {
      try {
        const result = window.appquery();
        if (result) {
          return result;
        }
      } catch (error) {
        console.error('❤️ Error calling appquery():', error);
      }
    }

    if (window.appquery) {
      return window.appquery;
    }

    return null;
  }

  function normalizeColorTokenMap(rawTokens) {
    if (!rawTokens) {
      return {};
    }

    let parsed = rawTokens;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        console.error('❤️ Unable to parse color token payload string', error);
        parsed = {};
      }
    }

    if (parsed && typeof parsed === 'object') {
      if (parsed['%d1'] && typeof parsed['%d1'] === 'object') {
        return parsed['%d1'];
      }

      if (parsed.body && parsed.body['%d1'] && typeof parsed.body['%d1'] === 'object') {
        return parsed.body['%d1'];
      }

      if (parsed.data && parsed.data['%d1'] && typeof parsed.data['%d1'] === 'object') {
        return parsed.data['%d1'];
      }
    }

    return parsed || {};
  }

  // Helper to get app name and version from URL
  function getAppInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      appname: urlParams.get('id'),
      app_version: urlParams.get('version') || 'test'
    };
  }

  // Helper to generate session ID (similar to Bubble's format)
  function generateSessionId() {
    return Date.now() + 'x' + Math.floor(Math.random() * 1000000000);
  }

  function postToIsolatedWorld(action, payload) {
    window.postMessage({
      source: MAIN_WORLD_SOURCE,
      action,
      payload
    }, '*');
  }

  // Get color tokens from appquery
  function getColorTokens() {
    try {
      const appqueryRoot = getAppqueryRoot();

      if (!appqueryRoot) {
        throw new Error('appquery not available');
      }

      if (typeof appqueryRoot.get_public_setting === 'function') {
        const publicSetting = appqueryRoot.get_public_setting('color_tokens_user');
        if (publicSetting) {
          return publicSetting;
        }
      }

      if (appqueryRoot.app && typeof appqueryRoot.app === 'function') {
        const appObj = appqueryRoot.app();
        if (appObj && appObj.json && typeof appObj.json.child === 'function') {
          const colorTokens = appObj.json
            .child('settings')
            .child('client_safe')
            .child('color_tokens_user');

          if (colorTokens && typeof colorTokens.exists === 'function' && colorTokens.exists()) {
            return colorTokens.raw();
          }
        }
      }

      throw new Error('color tokens not found in appquery');
    } catch (error) {
      console.error('❤️ Error getting color tokens:', error);
      throw error;
    }
  }

  function trySendInitialColorTokens(attempt = 0) {
    try {
      const colorTokens = getColorTokens();
      const normalizedTokenMap = normalizeColorTokenMap(colorTokens);

      postToIsolatedWorld(INITIAL_TOKEN_ACTION, {
        status: 'success',
        colorTokens,
        normalizedTokenMap
      });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      const shouldRetry = /appquery/i.test(message) && attempt < MAX_APPQUERY_ATTEMPTS;

      console.error('❤️ Failed to fetch initial color tokens:', message, 'attempt:', attempt);

      if (shouldRetry) {
        setTimeout(() => {
          trySendInitialColorTokens(attempt + 1);
        }, APPQUERY_RETRY_DELAY);
        return;
      }

      postToIsolatedWorld(INITIAL_TOKEN_ACTION, {
        status: 'error',
        error: message
      });
    }
  }

  // Save color tokens with new order
  function saveColorTokenOrder(tokenOrder) {
    return new Promise((resolve, reject) => {
      try {
        console.log('❤️ Saving color token order:', tokenOrder);

        // Get current color tokens from appquery
        const currentTokens = getColorTokens();
        const tokenMap = normalizeColorTokenMap(currentTokens);
        console.log('❤️ Current tokens:', currentTokens);

        // Build updated tokens object with new order
        const updatedTokens = {};

        // Update order for each token based on the new order array
        tokenOrder.forEach((tokenId, index) => {
          if (tokenMap[tokenId]) {
            updatedTokens[tokenId] = {
              ...tokenMap[tokenId],
              order: index
            };
          }
        });

        // Include any tokens that weren't in the order (shouldn't happen, but just in case)
        Object.keys(tokenMap).forEach(tokenId => {
          if (!updatedTokens[tokenId]) {
            updatedTokens[tokenId] = {
              ...tokenMap[tokenId],
              order: tokenOrder.length
            };
          }
        });

        console.log('❤️ Updated tokens:', updatedTokens);

        // Get app info
        const { appname, app_version } = getAppInfo();

        // Build the payload matching Bubble's format
        const payload = {
          v: 1,
          appname: appname,
          app_version: app_version,
          changes: [
            {
              body: {
                '%d1': updatedTokens
              },
              path_array: ['settings', 'client_safe', 'color_tokens_user'],
              intent: {
                name: 'ChangeAppSetting',
                id: 1
              },
              version_control_api_version: 7,
              changelog_data: [
                {
                  operation: 'changed',
                  before_value: null,
                  after_value: null,
                  display_name: 'User color tokens',
                  type: 'Setting',
                  root: null,
                  change_path: 'settings.client_safe.color_tokens_user.',
                  inner_nodes_info: [
                    {
                      change_path: 'settings.client_safe.color_tokens_user.',
                      type: 'Setting',
                      display_name: 'User color tokens'
                    }
                  ],
                  inner_node_count: 1
                }
              ],
              session_id: generateSessionId()
            },
            {
              type: 'id_counter',
              value: 10006263 // This might need to be dynamic, but using a static value for now
            }
          ]
        };

        console.log('❤️ Posting payload:', payload);

        // Use Lib() to post to the write endpoint
        if (!window.Lib) {
          throw new Error('Lib() not available');
        }

        window.Lib().location.post('server://appeditor/write', payload, (err, res) => {
          if (err) {
            console.error('❤️ Error saving color tokens:', err);
            reject(err);
          } else {
            console.log('❤️ Successfully saved color tokens:', res);
            resolve(res);
          }
        });
      } catch (error) {
        console.error('❤️ Error in saveColorTokenOrder:', error);
        reject(error);
      }
    });
  }

  // Listen for messages from isolated world
  window.addEventListener('message', async (event) => {
    if (!event || event.source !== window || !event.data || event.data.source !== ISOLATED_WORLD_SOURCE) {
      return;
    }

    if (event.data.action === SAVE_TOKEN_ACTION) {
      console.log('❤️ Received save request:', event.data);

      try {
        const tokenOrder = event.data.payload.tokenOrder;
        const result = await saveColorTokenOrder(tokenOrder);

        postToIsolatedWorld(SAVE_RESULT_ACTION, {
          status: 'success',
          result: result
        });
      } catch (error) {
        postToIsolatedWorld(SAVE_RESULT_ACTION, {
          status: 'error',
          error: error.message || String(error)
        });
      }
    }

    if (event.data.action === REQUEST_TOKEN_ACTION) {
      console.log('❤️ Received request for initial color tokens');
      trySendInitialColorTokens();
    }
  });

  // Attempt to send initial token data on load
  trySendInitialColorTokens();

  console.log('❤️ Main world script ready to receive save requests');
})();
