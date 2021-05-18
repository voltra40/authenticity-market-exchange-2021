pragma solidity >=0.4.22 <=0.6.0;

contract Ame {
    
    address chairperson;
    
    struct Member {
        bool is_member;
        uint items_for_sale;
        uint transactions;
    }
    
    struct Item {
        address payable seller;
        string item_name;
        uint price;
        bool authenticity;
    }
    
    struct Transactions {
        address last_seller;
        address last_buyer;
        string tracking_number;
        bool has_shipped;
        uint first_sell_price;
        uint last_sell_price;
        uint price_change;
    }
    
    //hopefully maps a member to an address
    mapping (address => Member) member_details;
    
    mapping (address => uint) public balances;
    
    mapping (uint => Transactions) item_transactions;
    
    //mapping (uint => bool) public authenticity;
    
    //new, maps an item to an id 
    mapping (uint => Item) item;
    
    //Item events
    event item_listed(uint id);
    event item_validated(bool authentic);
    //event item_transaction(uint id, uint price, address buyer, address seller);
    
    function get_member_details(address member) public view returns(bool is_member, uint items_for_sale, uint transactions)
    {
        //require(member_details[member].is_member, 'member does not exist');
        return(member_details[member].is_member, member_details[member].items_for_sale, member_details[member].transactions);
    }
    
    function view_transactions(uint id) public view returns(address last_seller, address last_buyer, string memory tracking_number, bool has_shipped, uint last_sell_price, uint price_change)
    {
        //require(item_transactions[id].last_sell_price > 0, 'item does not exist or has not undergone a transaction');
        return(item_transactions[id].last_seller, item_transactions[id].last_buyer, item_transactions[id].tracking_number, item_transactions[id].has_shipped, item_transactions[id].last_sell_price, item_transactions[id].price_change);
    }
    
    function get_item(uint id) public view returns(address seller, string memory item_name, uint price, bool authenticity)
    {
        return(item[id].seller, item[id].item_name, item[id].price, item[id].authenticity);
    }

    modifier chairperson_modifier()
    {
        require(msg.sender == chairperson);
        _;
    }
    
    modifier member_modifier{ 
        require(member_details[msg.sender].is_member);
        _;
    }
    
    function register(address member) public payable
    {
        member_details[member].is_member = true;
    }
    
    function unregister (address payable member) public chairperson_modifier
    {
        require(msg.sender == chairperson, 'you are not a moderator of this blockchain');
        member_details[member].is_member = false;
        member_details[member].items_for_sale = 0;
        member_details[member].transactions = 0;
        //return balances to member
        member.transfer(balances[member]);
    }
    
    constructor () public payable
    {
        chairperson = msg.sender;
    }
    
    function validate(uint id, bool authentic) public chairperson_modifier
    {
        require(msg.sender == chairperson, 'you are not a moderator of this blockchain');
        //changes item validity to boolean value provided by chairperson
        item[id].authenticity = authentic;
        
        //submit phase
        emit item_validated(authentic);
    }
        
    function list_item(string memory item_name, uint id, uint price) public member_modifier
    {
        require(member_details[msg.sender].is_member, 'not a member yet, please register');
        require(price > 0, 'please enter a price greater than 0');
        require(item[id].seller == address(0x0), 'item of this id already exist');
        member_details[msg.sender].items_for_sale += 1;
        
        //Item memory new_item = Item(item_name, price, id);
        //member_details[msg.sender].items.push(new_item);
        item[id].seller = msg.sender;
        item[id].item_name = item_name;
        item[id].price = price;
        item[id].authenticity = false;
        
        //phase
        emit item_listed(id);
    }
    
    function buy(uint id) public payable member_modifier
    {
        require(item[id].seller != address(0x0), 'item of this id does not exist');
        
        //uint index = get_item_index(member_details[receiver].items, id);
        uint price = item[id].price * 1000000000000000000;
        //check buyer is selling correct amount
        require(msg.value >= price, 'insufficient sending amount');
        
        address payable receiver = item[id].seller;
        receiver.transfer(price);
        
        //leftovers get stored as members balance
        balances[msg.sender] += (msg.value - price);
        
        member_details[msg.sender].transactions += 1;
        member_details[receiver].transactions += 1;
        member_details[receiver].items_for_sale -= 1;
        
        //track item
        item_transactions[id].last_seller = receiver;
        item_transactions[id].last_buyer = msg.sender;
        item_transactions[id].tracking_number = "N/A";
        item_transactions[id].has_shipped = false;
        
        uint initial_value =  item_transactions[id].last_sell_price;
        uint final_value = item[id].price;
        
        if(item_transactions[id].last_sell_price > 0) 
        {
            //assuming initial value > 0 && item has been sold before
            item_transactions[id].price_change  = (((final_value-initial_value) * 100)/initial_value);
        }
        
        item_transactions[id].last_sell_price = item[id].price;

        //item is sold, clear item infromation
        delete item[id];
    }

    function submit_tracking(uint id, string memory tracking_number) public member_modifier{
        require(item_transactions[id].last_sell_price > 0, 'item does not exist or has not undergone a transaction');
        //checks that member was seller of the item for the given transaction
        require(item_transactions[id].last_seller == msg.sender, 'you must be the current seller of this item to add tracking information');
        item_transactions[id].tracking_number = tracking_number;
        item_transactions[id].has_shipped = true;
    }
}