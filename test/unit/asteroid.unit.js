describe("The Asteroid constructor", function () {

	beforeEach(function () {
		window.DDP = _.noop;
	});

	afterEach(function () {
		delete window.DDP;
	});

	it("should throw if the first argument is not a string", function () {
		var troublemaker = function () {
			new Asteroid({});
		};
		troublemaker.should.throw("Assertion failed: expected String, instead got Object");
	});

	it("should configure the instance according to the passed arguments", function () {

		sinon.stub(Asteroid.prototype, "_init");
		var ceres;

		ceres = new Asteroid("example.com", true, true);
		ceres._host.should.equal("https://example.com");
		ceres._ddpOptions.endpoint.should.equal("wss://example.com/websocket");
		ceres._ddpOptions.debug.should.equal(true);

		ceres = new Asteroid("example.com", false, true);
		ceres._host.should.equal("http://example.com");
		ceres._ddpOptions.endpoint.should.equal("ws://example.com/websocket");
		ceres._ddpOptions.debug.should.equal(true);

		ceres = new Asteroid("example.com", true);
		ceres._host.should.equal("https://example.com");
		ceres._ddpOptions.endpoint.should.equal("wss://example.com/websocket");
		_.isUndefined(ceres._ddpOptions.debug).should.equal(true);

		ceres = new Asteroid("example.com");
		ceres._host.should.equal("http://example.com");
		ceres._ddpOptions.endpoint.should.equal("ws://example.com/websocket");
		_.isUndefined(ceres._ddpOptions.debug).should.equal(true);

		Asteroid.prototype._init.restore();

	});

	it("should configure the instance depending on whether SockJS is used or not", function () {

		sinon.stub(Asteroid.prototype, "_init");
		var ceres;

		window.SockJS = {};
		ceres = new Asteroid("example.com");
		ceres._host.should.equal("http://example.com");
		ceres._ddpOptions.endpoint.should.equal("ws://example.com/sockjs");
		ceres._ddpOptions.SocketConstructor.should.equal(SockJS);

		delete window.SockJS;
		ceres = new Asteroid("example.com");
		ceres._host.should.equal("http://example.com");
		ceres._ddpOptions.endpoint.should.equal("ws://example.com/websocket");
		ceres._ddpOptions.SocketConstructor.should.equal(WebSocket);

		Asteroid.prototype._init.restore();

	});

});

describe("An Asteroid instance", function () {

	beforeEach(function () {
		window.DDP = function () {
			ddp = {};
			ddp.on = function (e, f) {
				if (e === "connected") ddp.emitConnected = f;
				if (e === "added") ddp.emitAdded = f;
				if (e === "changed") ddp.emitChanged = f;
				if (e === "removed") ddp.emitRemoved = f;
			};
			ddp.sub = sinon.spy();
			return ddp;
		};
	});

	afterEach(function () {
		delete window.DDP;
	});

	it("should emit a connected event upon connection", function () {
		var ceres = new Asteroid("example.com");
		ceres._emit = sinon.spy();
		ceres.ddp.emitConnected();
		ceres._emit.calledWith("connected").should.equal(true);
	});

});

describe("The Asteroid.subscribe method", function () {

	beforeEach(function () {
		window.DDP = function () {
			ddp = {};
			ddp.on = function (e, f) {
				if (e === "connected") ddp.emitConnected = f;
				if (e === "added") ddp.emitAdded = f;
				if (e === "changed") ddp.emitChanged = f;
				if (e === "removed") ddp.emitRemoved = f;
			};
			ddp.sub = function (n, p, f) {
				ddp.resolveOrReject = f;
				ddp.params = p;
			};
			return ddp;
		};
	});

	afterEach(function () {
		delete window.DDP;
	});

	it("should throw if the first argument is not a string", function () {
		var ceres = new Asteroid("example.com");	
		var troublemaker = function () {
			ceres.subscribe({});
		};
		troublemaker.should.throw("Assertion failed: expected String, instead got Object");
	});

	it("should return a promise", function () {
		var ceres = new Asteroid("example.com");	
		var promise = ceres.subscribe("sub");
		Q.isPromise(promise).should.equal(true);
	});

	it("which will be returned again if multiple calls to subscribe are made", function () {
		var ceres = new Asteroid("example.com");	
		var promise1 = ceres.subscribe("sub");
		var promise2 = ceres.subscribe("sub");
		promise1.should.equal(promise2);
	});

	it("which will be resolved if the subscription is successful", function () {
		var ceres = new Asteroid("example.com");	
		var promise = ceres.subscribe("sub");
		ceres.ddp.resolveOrReject();
		promise.isFulfilled().should.equal(true);
	});

	it("which will be rejected if the subscription is not successful", function () {
		var ceres = new Asteroid("example.com");	
		var promise = ceres.subscribe("sub");
		ceres.ddp.resolveOrReject({});
		promise.isRejected().should.equal(true);	
	});

	it("should pass the correct parameters to the publish function (on the server)", function () {
		var p0 = {};
		var p1 = {};
		var p2 = {};
		// ...
		var ceres = new Asteroid("example.com");	
		var promise = ceres.subscribe("sub", p0, p1, p2);
		ceres.ddp.params[0].should.equal(p0);
		ceres.ddp.params[1].should.equal(p1);
		ceres.ddp.params[2].should.equal(p2);
	});

});

describe("The Asteroid.unsubscribe method", function () {

	it("should throw if the first argument is not a string", function () {
		var ceres = new Asteroid("example.com");	
		var troublemaker = function () {
			ceres.unsubscribe({});
		};
		troublemaker.should.throw("Assertion failed: expected String, instead got Object");
	});

});

describe("The Asteroid.apply method", function () {

	beforeEach(function () {
		window.DDP = function () {
			ddp = {};
			ddp.on = _.noop;
			ddp.sub = _.noop;
			ddp.method = sinon.spy(function (m, p, r, u) {
				ddp.params = p;
				ddp.result = r;
				ddp.updated = u;
			});
			return ddp;
		};
	});

	afterEach(function () {
		delete window.DDP;
	});

	it("should throw if the first argument is not a string", function () {
		var ceres = new Asteroid("example.com");	
		var troublemaker = function () {
			ceres.apply({});
		};
		troublemaker.should.throw("Assertion failed: expected String, instead got Object");
	});

	it("should throw if the second argument is not an array", function () {
		var ceres = new Asteroid("example.com");	
		var troublemaker = function () {
			ceres.apply("", {});
		};
		troublemaker.should.throw("Assertion failed: expected Array, instead got Object");
	});

	it("should return an object containing two promises", function () {
		var ceres = new Asteroid("example.com");	
		var ret = ceres.apply("method");
		Q.isPromise(ret.result).should.equal(true);
		Q.isPromise(ret.updated).should.equal(true);
	});
	
	describe("the result promise", function () {

		it("should be resolved if the method is successful", function (done) {
			var ceres = new Asteroid("example.com");	
			var res = {};
			var ret = ceres.apply("method");
			ret.result.then(function (arg) {
				try {
					ret.result.isFulfilled().should.equal(true);
					arg.should.equal(res);
				} catch (e) {
					done(e);
				}
				done();
			});
			ceres.ddp.result(null, res);
		});

		it("should be rejected if the method is not successful", function (done) {
			var ceres = new Asteroid("example.com");	
			var err = {};
			var ret = ceres.apply("method");
			ret.result.fail(function (arg) {
				try {
					ret.result.isRejected().should.equal(true);
					arg.should.equal(err);
				} catch (e) {
					done(e);
				}
				done();
			});
			ceres.ddp.result(err);
		});
		
	});

	describe("the updated promise", function () {

		it("should be resolved when the updated message is received", function () {
			var ceres = new Asteroid("example.com");	
			var ret = ceres.apply("method");
			ceres.ddp.updated();
			ret.updated.isFulfilled().should.equal(true);
		});

		it("should be rejected if the method is not successful", function () {
			var ceres = new Asteroid("example.com");	
			var ret = ceres.apply("method");
			ceres.ddp.result(true);
			ret.updated.isRejected().should.equal(true);
		});
		
	});

});