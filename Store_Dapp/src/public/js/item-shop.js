Mall = {
  web3Provider: null,
  contracts: {},
  address: 0x00,
  ownerYN : 'N',
  grade: null,
  
  init: async function() {
    await Init.init();
    Mall.address = address;
    Mall.getAccountList();
    Mall.getMyItems();
  },

  getAccountList: function() {
    Mall.getAccountInfo();
    Mall.getItemList();
    Mall.getOwner();
    Mall.bindEvents();
  },

  getMyItems: function() {
    Mall.getGradeInfo()
    Mall.getTokenInfo();
    Mall.getMyItemList();
  },

  getGradeInfo: function() {
    
    Init.membershipInstance.getGrade({from: Mall.address}).then(function (result) {
      Mall.grade = result;
      if (result == 'Bronze') {
        $('#accountGrade').html("<font color='bronze'><b>Bronze</b></font>");
      } else if (result == 'Silver') {
        $('#accountGrade').html("<font color='silver'><b>Silver</b></font>");
      } else if (result == 'Gold') {
        $('#accountGrade').html("<font color='gold'><b>Gold</b></font>");
      }
    });
  },

  getAccountInfo: function() {
    var ether;
    $('#accountAddr').text(Mall.address);
    
    web3.eth.getBalance(Mall.address, function(account, balance) {  
      ether = parseInt(web3.utils.fromWei(balance, "ether")).toFixed(2) + " ETH";
      $('#ethValue').text(ether);
    });
  },

  getTokenInfo: function() {
    Init.OSDCTokenInstance.balanceOf(Mall.address,{from:Mall.address}).then(function(result) {
      var token = result.words[0];
      $('#tokenValue').text(token);
    });
  },

  getMyItemList: function() {
    var nitemCode;

    Init.shoppingInstance.getMyAllItems({from: Mall.address, gas:6000000}).then(function(result) {
      const JSONItemlist = JSON.parse(result);
      console.log(JSONItemlist);
      if (JSONItemlist[0].itemCode == 9999) { return; }
      for (var i = 0; i < JSONItemlist.length; i++) {
        
        var itemInfos = JSONItemlist[i];
        var itemCode = itemInfos.itemCode;
        if(itemCode == 9999) continue;
        $('.single-shop-product').each(function (index, item){
          nitemCode = $(item).data('itemcode');
          if(nitemCode == itemCode){
            $(item).find('button').text('Sold-out').attr('disabled', true);
            $(item).find('.add_to_cart_button').css('background-color', 'green');             
          }
        });
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getItemList: function() {
    var itemrow = $('#itemrow');
    var itemTemplate = $('#itemTemplate');       
    Init.itemInstance.getAllItems({from: Mall.address, gas:6000000}).then(function(result) {
      const JSONItemlist = JSON.parse(result);
      // console.log(JSON.parse(result));

      if(JSONItemlist[0].itemCode == 9999){
  
        var html = "<center><img src='public/images/no_product.png'/></center>";
        itemrow.html(html);
        return;
      }

      for (i = 0; i < JSONItemlist.length; i++) {
     
        var itemInfos = JSONItemlist[i];
        if(itemInfos.itemCode == 9999){ break;}
        itemTemplate.find('.item-name').text(itemInfos.name);
        itemTemplate.find('img').attr('src', 'public/images/' + itemInfos.imgpath);
        itemTemplate.find('.product-carousel-price-sub').text(itemInfos.cost+' osdc');
        if(itemInfos.buy == 1){
            itemTemplate.find('button').text('Sold out').attr('disabled', true);
            itemTemplate.find('.add_to_cart_button').css('background-color', '#930000');          
        }else{
            itemTemplate.find('button').text('BUY').attr('disabled', false);
            itemTemplate.find('.add_to_cart_button').css('background-color', '#5a88ca');                    
        }
        itemTemplate.find('.single-shop-product').attr('data-itemcode', itemInfos.itemCode);          
        itemTemplate.find('.add_to_cart_button').attr('data-name', itemInfos.name);
        itemTemplate.find('.add_to_cart_button').attr('data-itemcode', itemInfos.itemCode);
        itemTemplate.find('.add_to_cart_button').attr('data-cost', itemInfos.cost);
        itemTemplate.find('.add_to_cart_button').attr('data-src', 'public/images/' + itemInfos.imgpath);
        itemrow.append(itemTemplate.html());
        
      }
      
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getOwner: function() {
    Init.shoppingInstance.owner.call().then(function(result) {
      if (result == Mall.address) {
        Mall.ownerYN = 'Y';
        $("#accountAddrAdmin").text('Account Address(Seller)');
      }else{
        $("#accountAddrAdmin").text('Account Address(Buyer)');
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  bindEvents: function() {
    $(document).on('click', '.add_to_cart_button', Mall.buyItem);
  },

  buyItem: async function(event) {
    var index = parseInt($(event.target).data('itemcode'));
    
    Init.shoppingInstance.buyItem(index,{from: Mall.address, gas:3000000}).then(function(result) {
      alert("Success!");
      Mall.getTokenInfo();
      Mall.getMyItemList();
      Mall.getGradeInfo();
    }).catch(function(err) {
      console.log(err.message);
      if(err.message == 'Returned error: VM Exception while processing transaction: revert need token -- Reason given: need token.'){
        alert('토큰이 부족합니다.');
      }else if(err.message =  'Returned error: VM Exception while processing transaction: revert Already blacklist -- Reason given: Already blacklist.'){
        alert('블랙리스트로 등록되어 물건을 구매 할 수 없습니다.');
      }
    });
  }
};

$(function() {
  $(window).load(function() {
    Mall.init();
  });
});
