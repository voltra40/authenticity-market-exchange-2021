App = {
  web3Provider: null,
  contracts: {},
  address: null,
  url: "http://127.0.0.1:7545",
  network_id: 5777,
  supervisor: null,
  chairPerson: null,
  current_account: null,
  wei: 1000000000000000000,
  index: 0,
  margin: 10,
  left: 15,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Ame.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.ame = TruffleContract(data);
      // Set the provider for our contract
      App.contracts.ame.setProvider(App.web3Provider);
      return App.bindEvents();
    });
  },

  bindEvents: function () {
    $(document).on("click", "#register_your_address", function () {
      App.register(jQuery("#address").val());
    });
    $(document).on("click", "#get_member", function () {
      App.getMember(jQuery("#address2").val());
    });
    $(document).on("click", "#get_item", function () {
      App.getItem(jQuery("#get_item_id").val());
    });
    $(document).on("click", "#check_authenticity", function () {
      App.showAuthenticity();
    });
    $(document).on("click", "#view_transactions", function () {
      App.viewTransactions(jQuery("#get_item_id2").val());
    });
    $(document).on("click", "#list_item", function () {
      App.listItem(jQuery("#list_item_name").val(), jQuery("#list_item_id").val(), jQuery("#list_item_price").val());
    });
    $(document).on("click", "#buy_item", function () {
      App.buyItem(jQuery("#buy_item_id").val(), jQuery("#buy_item_price").val());
    });
    $(document).on("click", "#validate", function () {
      App.validate(jQuery("#validate_id").val());
    });
    $(document).on("click", "#submit_tracking", function () {
      App.submitTracking(jQuery("#get_item_id3").val(), jQuery("#tracking").val());
    });
  },

  populateAddress: function () {
    App.current_account = web3.eth.defaultAccount;
    var option = "<option></option>";
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts(
      (err, accounts) => {
        for (var i = 0; i < accounts.length; i++) {
          option += "<option>" + accounts[i] + "</option>";
        }
        // jQuery("#asset_owner").append(option);
        // jQuery("#to_address").append(option);
        // jQuery("#from_address").append(option);
        jQuery("#address").append(option);
        jQuery("#address2").append(option);
        // jQuery('#transfer_to_address').append(option);
      }
    );
  },

  //function for register
  register: function (addr) {
    if (addr === "") {
      alert("please choose an address");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
      return instance.register(addr);
    });
  },

  getMember: function(addr) {
    if (addr === "") {
      alert("please choose an address");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
      return instance.get_member_details(addr);
    })
    .then(function (result) {
      if(result[0]) {
        jQuery('#get_member_status').html("member is registered");
        jQuery('#get_items_for_sale').html("number of items for sale: " + result[1]);
        jQuery('#get_transaction_number').html("number of transactions: " + result[2]);  
      } else {
        alert("member does not exist");
      }
    });
  },

  getItem: function(id) {
    if (id === "") {
      alert("Please enter item id");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
      return instance.get_item(id);
    })
    .then(function (result) {
      if(result[1] === ""){
        alert("item of this id does not exist");
      } else {
        jQuery('#get_item_seller').html("item seller address: " + result[0]);
        jQuery('#get_item_name').html("item name: " + result[1]);
        jQuery('#get_item_price').html("item price: " + result[2] + " ETH");
        if(result[3]) {
          jQuery('#authenticity').html("item is authentic");
        } else {
          jQuery('#authenticity').html("awaiting authentification");
        }
      }
    });
  },

  showAuthenticity: function () {
    App.contracts.ame.deployed().then(function (instance) {
        instance.validate(id, true);
    })
    .then(function (result) {
      if(result){
        jQuery('#authenticity').html("authentic");

      } else {
        jQuery('#authenticity').html("not authentic");
      }
    });
  },

  viewTransactions: function(id) {
    if (id === "") {
      alert("please enter item id");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
      return instance.view_transactions(id);
    })
    .then(function (result) {
      if(result[4] > 0) {
        jQuery('#last_seller').html("last seller address: " + result[0]);
        jQuery('#last_buyer').html("last buyer address: " + result[1]);
        if(result[2] === "N/A") {
          jQuery('#tracking_number').html("awaiting tracking number");
        } else {
          jQuery('#tracking_number').html("tracking number: " + result[2]);
        }
        if(result[3]) {
          jQuery('#has_shipped').html("shipped");
        } else {
          jQuery('#has_shipped').html("awaiting shipment");
        }
        jQuery('#last_sell_price').html("last sell price: " + result[4] + " ETH");
        if(result[5] == 0) {
          jQuery('#price_change').html("no price change data");
        } else {
          jQuery('#price_change').html("price change: " + result[5] + "%");
        }  
      } else {
        alert("item does not exist or has not undergone a transaction");
      }
    });
  },

  listItem: function (name, id, price) {
    if (name === "" || id === "" || price === "") {
      alert("Please enter all values");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
        instance.list_item(name, id, price);
    });
  },

  buyItem: function (id, price) {
    if (id === "" || price === "") {
      alert("Please enter all values");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
        instance.buy(id, {value: (price * App.wei)});
    });
  },

  validate: function (id) {
    if (id === "") {
      alert("Please enter item id");
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
        instance.validate(id, true);
    });
  },

  submitTracking: function (id, tracking) {
    if (id === "" || tracking === "") {
      alert("Please enter all values");
      alert(id);
      alert(tracking);
      return false;
    }
    App.contracts.ame.deployed().then(function (instance) {
        instance.submit_tracking(id, tracking);
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});

window.ethereum.on('accountsChanged', function (){
  location.reload();
});