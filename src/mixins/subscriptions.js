import EventEmitter from "wolfy87-eventemitter";
import SubscriptionCache from "../lib/subscription-cache";
import fingerprintSub from "../lib/fingerprint-sub.js";

function _restartSubscriptions () {
    this._subscriptionsCache.forEach(sub => {
        this._subscriptionsCache.del(sub.id);
        this.subscribe(sub.name, ...sub.params);
    });
}

export function init () {
    this._subscriptionsCache = new SubscriptionCache();
    this._ddp
        .on("ready", msg => {
            msg.subs.forEach(id => {
                this._subscriptionsCache.get(id).emit("ready");
            });
        })
        .on("nosub", msg => {
            if (msg.error) {
                this._subscriptionsCache.get(msg.id).emit("error", msg.error);
            }
            this._subscriptionsCache.del(msg.id);
        })
        .on("connected", _restartSubscriptions.bind(this));
}

export function subscribe (name, ...params) {
    var fingerprint = fingerprintSub(name, params);
    var sub = this._subscriptionsCache.get(fingerprint);
    if (!sub) {
        // If there is no cached subscription, subscribe
        var id = this._ddp.sub(name, params);
        // Build the subscription object and save it in the cache
        sub = new EventEmitter();
        sub.fingerprint = fingerprint;
        sub.id = id;
        sub.name = name;
        sub.params = params;
        this._subscriptionsCache.add(sub);
    }
    // Return the subscription object
    return sub;
}

export function unsubscribe (id) {
    this._ddp.unsub(id);
}
