/* globals view, args, config, utils */
'use strict';

{
  view.threads = () => [...document.querySelectorAll('tr[data-selected="true"]')]
    .map(tr => tr.dataset.thread);

  document.addEventListener('click', ({target}) => {
    const cmd = target.dataset.cmd;

    if (
      cmd === 'mark-as-read' ||
      cmd === 'mark-as-unread' ||
      cmd === 'toggle-flag' ||
      cmd === 'trash' ||
      cmd === 'spam'
    ) {
      const options = {
        method: 'notmuch.tag',
        threads: view.threads(),
        tags: [],
        query: args.query // to perform on this view only not those ids that are not in this query
      };
      if (cmd === 'mark-as-read') {
        options.tags.push('-unread');
      }
      else if (cmd === 'mark-as-unread') {
        options.tags.push('+unread');
      }
      else if (cmd === 'trash') {
        options.tags.push('+deleted');
      }
      else if (cmd === 'spam') {
        options.tags.push('+spam');
      }
      else if (cmd === 'toggle-flag') {
        const tr = target.closest('tr');
        options.threads = [tr.dataset.thread];
        options.tags.push(tr.dataset.flagged === 'true' ? '+flagged' : '-flagged');
      }
      chrome.runtime.sendMessage(options, response => {
        if (response.error === undefined) {
          view.emit('refresh');
        }
      });
    }
    else if (cmd === 'copy-ids') {
      const str = view.threads().map(id => 'thread:' + id).join(' ');
      utils.clipboard.copy(str);
    }
    else if (cmd === 'copy-filenames') {
      const query = view.threads().map(id => 'thread:' + id).join(' ');
      utils.files(query).then(files => {
        utils.clipboard.copy(files.join('\n'));
      }).catch(e => console.log(e));
    }
    else if (cmd === 'open') {
      if (window.top !== window) {
        window.top.api.popup.show('../show/index.html?query=' + view.threads().map(id => 'thread:' + id).join(' '));
      }
    }
    else if (cmd === 'archive') {
      utils.storage.get(config).then(prefs => {
        const action = prefs.archive.action
          .replace('[threads]', view.threads().map(id => 'thread:' + id).join(' '))
          .replace('[query]', args.query);

        utils.native.exec(action).then(() => view.emit('refresh'));
      });
    }
  });
}
