console.log("❤️" + "Styles Drag Rearrange - MAIN WORLD script");

(function() {
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

  // Get color tokens from appquery
  function getColorTokens() {
    try {
      if (!window.appquery) {
        throw new Error('appquery not available');
      }

      const colorTokens = window.appquery().app().json
        .child('settings')
        .child('client_safe')
        .child('color_tokens_user');

      if (!colorTokens.exists()) {
        throw new Error('Color tokens not found in appquery');
      }

      return colorTokens.raw();
    } catch (error) {
      console.error('❤️ Error getting color tokens:', error);
      throw error;
    }
  }

  // Save color tokens with new order
  function saveColorTokenOrder(tokenOrder) {
    return new Promise((resolve, reject) => {
      try {
        console.log('❤️ Saving color token order:', tokenOrder);

        // Get current color tokens from appquery
        const currentTokens = getColorTokens();
        console.log('❤️ Current tokens:', currentTokens);

        // Build updated tokens object with new order
        const updatedTokens = {};
        const tokenMap = currentTokens['%d1'] || {};

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
    if (
      event.source === window &&
      event.data &&
      event.data.source === 'isolated-world-script' &&
      event.data.action === 'saveColorTokenOrder'
    ) {
      console.log('❤️ Received save request:', event.data);

      try {
        const tokenOrder = event.data.payload.tokenOrder;
        const result = await saveColorTokenOrder(tokenOrder);

        // Send success response
        window.postMessage({
          source: 'main-world-script',
          action: 'saveColorTokenOrderResult',
          payload: {
            status: 'success',
            result: result
          }
        }, '*');
      } catch (error) {
        // Send error response
        window.postMessage({
          source: 'main-world-script',
          action: 'saveColorTokenOrderResult',
          payload: {
            status: 'error',
            error: error.message || String(error)
          }
        }, '*');
      }
    }
  });

  console.log('❤️ Main world script ready to receive save requests');
})();
