import { g as getContext, c as create_ssr_component, a as subscribe, e as escape } from "../../chunks/index2.js";
import { w as writable } from "../../chunks/index.js";
/* @__PURE__ */ new WeakSet();
function notifiable_store(value) {
  const store = writable(value);
  let ready = true;
  function notify() {
    ready = true;
    store.update((val) => val);
  }
  function set(new_value) {
    ready = false;
    store.set(new_value);
  }
  function subscribe2(run) {
    let old_value;
    return store.subscribe((new_value) => {
      if (old_value === void 0 || ready && new_value !== old_value) {
        run(old_value = new_value);
      }
    });
  }
  return { notify, set, subscribe: subscribe2 };
}
function create_updated_store() {
  const { set, subscribe: subscribe2 } = writable(false);
  async function check() {
    return false;
  }
  return {
    subscribe: subscribe2,
    check
  };
}
({
  url: notifiable_store({}),
  page: notifiable_store({}),
  navigating: writable(
    /** @type {import('types').Navigation | null} */
    null
  ),
  updated: create_updated_store()
});
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    updated: stores.updated
  };
};
const page = {
  /** @param {(value: any) => void} fn */
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_page();
  return `<h1>${escape($page.status)}</h1>
<p>${escape($page.error?.message)}</p>`;
});
export {
  Error$1 as default
};
