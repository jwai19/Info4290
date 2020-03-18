
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  // private: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  //////////////////////beginning of render the page
  render: function() {
    var electionInstance;
    /////////////intializes the div id tags in the index.html file
    var loader = $("#loader");
    var content = $("#content");
    var endPage = $("#endPage"); 

    ////shows intially when screen is refreshing, see when pressing f5
    loader.show();
    content.hide();
    endPage.hide();

    // web3.eth.getAccounts(function(err, response) { 
    //   if (err === null) {
    //     App.private = response;
    //   }
    // });

    //////// Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    /////// Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          // var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      //////// Do not allow a user to vote
      //////this is when the form has been submitted
      if(hasVoted) {
        $('form').hide();    //hides form from html
        endPage.show();     ///shows my custom thank you message
      }

      //shows the typically voting page when the user has not voted
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      //////when refreshing or updating
      $("#content").hide();
      $("#endPage").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  question1: function() {

    var fname = $('#fname').val();
    // var test = web3.eth.accounts.create(fname);
    // var test = web3.eth.accounts.privateKeyToAccount(fname);
    // window.alert(web3.eth.accounts.privateKeyToAccount(fname));
    // web3.eth.accounts.wallet.add(fname)
    // web3.eth.accounts.privateKeyToAccount(fname);
    if (fname == 32) {
      window.alert("Im cranky");
    } else {
      // window.alert("lost enough");
      window.alert(App.account);
      // web3.eth.accounts.create(fname);
    }
  }
  
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
