use starknet::ContractAddress;

#[starknet::interface]
trait IVeyraPrivateMarkets<TContractState> {
    fn create_market(ref self: TContractState, market_id: u64, creator: ContractAddress, target: u256);
    fn open_market(ref self: TContractState, market_id: u64);
    fn commit_bid(ref self: TContractState, market_id: u64, bid_id: u64, commitment_hash: felt252, amount: u256);
    fn close_market(ref self: TContractState, market_id: u64);
    fn accept_bid(ref self: TContractState, market_id: u64, bid_id: u64);
    fn settle_bid(ref self: TContractState, market_id: u64, bid_id: u64);
    fn refund_bid(ref self: TContractState, market_id: u64, bid_id: u64);
    fn get_market_state(self: @TContractState, market_id: u64) -> u8;
    fn get_market_committed(self: @TContractState, market_id: u64) -> u256;
    fn get_bid_state(self: @TContractState, market_id: u64, bid_id: u64) -> u8;
    fn get_bid_amount(self: @TContractState, market_id: u64, bid_id: u64) -> u256;
}

#[starknet::contract]
mod VeyraPrivateMarkets {
    use starknet::ContractAddress;
    use core::num::traits::Zero;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    const MARKET_DRAFT: u8 = 0_u8;
    const MARKET_OPEN: u8 = 1_u8;
    const MARKET_CLOSED: u8 = 2_u8;
    const MARKET_SETTLED: u8 = 3_u8;
    const BID_COMMITTED: u8 = 0_u8;
    const BID_ACCEPTED: u8 = 1_u8;
    const BID_SETTLED: u8 = 2_u8;
    const BID_REFUNDED: u8 = 3_u8;

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Market {
        creator: ContractAddress,
        target: u256,
        committed: u256,
        state: u8,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Bid {
        bidder: ContractAddress,
        commitment_hash: felt252,
        amount: u256,
        state: u8,
    }

    #[storage]
    struct Storage {
        token: ContractAddress,
        markets: Map<u64, Market>,
        market_exists: Map<u64, bool>,
        bids: Map<(u64, u64), Bid>,
        bid_exists: Map<(u64, u64), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MarketCreated: MarketCreated,
        MarketOpened: MarketOpened,
        BidCommitted: BidCommitted,
        MarketClosed: MarketClosed,
        BidAccepted: BidAccepted,
        BidSettled: BidSettled,
        BidRefunded: BidRefunded,
    }

    #[derive(Drop, starknet::Event)]
    struct MarketCreated { #[key] market_id: u64, creator: ContractAddress, target: u256 }
    #[derive(Drop, starknet::Event)]
    struct MarketOpened { #[key] market_id: u64, creator: ContractAddress }
    #[derive(Drop, starknet::Event)]
    struct BidCommitted { #[key] market_id: u64, #[key] bid_id: u64, bidder: ContractAddress, commitment_hash: felt252, amount: u256 }
    #[derive(Drop, starknet::Event)]
    struct MarketClosed { #[key] market_id: u64, creator: ContractAddress }
    #[derive(Drop, starknet::Event)]
    struct BidAccepted { #[key] market_id: u64, #[key] bid_id: u64, creator: ContractAddress }
    #[derive(Drop, starknet::Event)]
    struct BidSettled { #[key] market_id: u64, #[key] bid_id: u64, bidder: ContractAddress, creator: ContractAddress, amount: u256 }
    #[derive(Drop, starknet::Event)]
    struct BidRefunded { #[key] market_id: u64, #[key] bid_id: u64, bidder: ContractAddress, amount: u256 }

    #[constructor]
    fn constructor(ref self: ContractState, token: ContractAddress) {
        assert(!token.is_zero(), 'token required');
        self.token.write(token);
    }

    #[external(v0)]
    fn create_market(ref self: ContractState, market_id: u64, creator: ContractAddress, target: u256) {
        let caller = get_caller_address();
        assert(!creator.is_zero(), 'creator required');
        assert(caller == creator, 'creator must sign');
        assert(target > 0, 'target required');
        assert(!self.market_exists.read(market_id), 'market exists');
        self.market_exists.write(market_id, true);
        self.markets.write(market_id, Market { creator, target, committed: 0, state: MARKET_DRAFT });
        self.emit(MarketCreated { market_id, creator, target });
    }

    #[external(v0)]
    fn open_market(ref self: ContractState, market_id: u64) {
        let caller = get_caller_address();
        let mut market = self.markets.read(market_id);
        assert(self.market_exists.read(market_id), 'market missing');
        assert(market.state == MARKET_DRAFT, 'market not draft');
        assert(market.creator == caller, 'only creator');
        market.state = MARKET_OPEN;
        self.markets.write(market_id, market);
        self.emit(MarketOpened { market_id, creator: caller });
    }

    #[external(v0)]
    fn commit_bid(ref self: ContractState, market_id: u64, bid_id: u64, commitment_hash: felt252, amount: u256) {
        let caller = get_caller_address();
        let mut market = self.markets.read(market_id);
        assert(self.market_exists.read(market_id), 'market missing');
        assert(market.state == MARKET_OPEN, 'market not open');
        assert(amount > 0, 'amount required');
        assert(!self.bid_exists.read((market_id, bid_id)), 'bid exists');
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer_from(caller, get_contract_address(), amount), 'token transfer failed');
        market.committed = market.committed + amount;
        self.markets.write(market_id, market);
        self.bid_exists.write((market_id, bid_id), true);
        self.bids.write((market_id, bid_id), Bid { bidder: caller, commitment_hash, amount, state: BID_COMMITTED });
        self.emit(BidCommitted { market_id, bid_id, bidder: caller, commitment_hash, amount });
    }

    #[external(v0)]
    fn close_market(ref self: ContractState, market_id: u64) {
        let caller = get_caller_address();
        let mut market = self.markets.read(market_id);
        assert(market.state == MARKET_OPEN, 'market not open');
        assert(market.creator == caller, 'only creator');
        market.state = MARKET_CLOSED;
        self.markets.write(market_id, market);
        self.emit(MarketClosed { market_id, creator: caller });
    }

    #[external(v0)]
    fn accept_bid(ref self: ContractState, market_id: u64, bid_id: u64) {
        let caller = get_caller_address();
        let market = self.markets.read(market_id);
        assert(market.state == MARKET_CLOSED, 'market not closed');
        assert(market.creator == caller, 'only creator');
        let mut bid = self.bids.read((market_id, bid_id));
        assert(self.bid_exists.read((market_id, bid_id)), 'bid missing');
        assert(bid.state == BID_COMMITTED, 'bid decided');
        bid.state = BID_ACCEPTED;
        self.bids.write((market_id, bid_id), bid);
        self.emit(BidAccepted { market_id, bid_id, creator: caller });
    }

    #[external(v0)]
    fn settle_bid(ref self: ContractState, market_id: u64, bid_id: u64) {
        let caller = get_caller_address();
        let mut market = self.markets.read(market_id);
        assert(market.state == MARKET_CLOSED, 'market not closed');
        assert(market.creator == caller, 'only creator');
        let mut bid = self.bids.read((market_id, bid_id));
        assert(bid.state == BID_ACCEPTED, 'bid not accepted');
        bid.state = BID_SETTLED;
        market.committed = market.committed - bid.amount;
        market.state = MARKET_SETTLED;
        self.bids.write((market_id, bid_id), bid);
        self.markets.write(market_id, market);
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer(caller, bid.amount), 'token transfer failed');
        self.emit(BidSettled { market_id, bid_id, bidder: bid.bidder, creator: caller, amount: bid.amount });
    }

    #[external(v0)]
    fn refund_bid(ref self: ContractState, market_id: u64, bid_id: u64) {
        let caller = get_caller_address();
        let market = self.markets.read(market_id);
        assert(market.state == MARKET_CLOSED, 'market not closed');
        let mut bid = self.bids.read((market_id, bid_id));
        assert(bid.state == BID_COMMITTED, 'bid decided');
        assert(bid.bidder == caller, 'only bidder');
        bid.state = BID_REFUNDED;
        self.bids.write((market_id, bid_id), bid);
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer(caller, bid.amount), 'token transfer failed');
        self.emit(BidRefunded { market_id, bid_id, bidder: caller, amount: bid.amount });
    }

    #[external(v0)]
    fn get_market_state(self: @ContractState, market_id: u64) -> u8 { self.markets.read(market_id).state }
    #[external(v0)]
    fn get_market_committed(self: @ContractState, market_id: u64) -> u256 { self.markets.read(market_id).committed }
    #[external(v0)]
    fn get_bid_state(self: @ContractState, market_id: u64, bid_id: u64) -> u8 { self.bids.read((market_id, bid_id)).state }
    #[external(v0)]
    fn get_bid_amount(self: @ContractState, market_id: u64, bid_id: u64) -> u256 { self.bids.read((market_id, bid_id)).amount }
}

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
}

#[cfg(test)]
mod tests;
