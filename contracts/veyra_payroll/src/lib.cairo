use starknet::ContractAddress;

#[starknet::interface]
trait IVeyraPayrollRegistry<TContractState> {
    fn create_route(ref self: TContractState, token: ContractAddress, amount: u256, recipient_commitment: felt252) -> u64;
    fn record_settlement(ref self: TContractState, route_id: u64, settlement_commitment: felt252);
    fn cancel_route(ref self: TContractState, route_id: u64);
    fn get_route_status(self: @TContractState, route_id: u64) -> u8;
    fn get_recipient_commitment(self: @TContractState, route_id: u64) -> felt252;
    fn get_owner(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
mod VeyraPayrollRegistry {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Route {
        creator: ContractAddress,
        token: ContractAddress,
        amount: u256,
        recipient_commitment: felt252,
        status: u8,
        settlement_commitment: felt252,
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        next_route_id: u64,
        routes: Map<u64, Route>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RouteCreated: RouteCreated,
        RouteSettled: RouteSettled,
    }

    #[derive(Drop, starknet::Event)]
    struct RouteCreated {
        #[key]
        route_id: u64,
        creator: ContractAddress,
        token: ContractAddress,
        amount: u256,
        recipient_commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct RouteSettled {
        #[key]
        route_id: u64,
        settlement_commitment: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        assert(!owner.is_zero(), 'owner required');
        self.owner.write(owner);
        self.next_route_id.write(1_u64);
    }

    #[external(v0)]
    fn create_route(
        ref self: ContractState,
        token: ContractAddress,
        amount: u256,
        recipient_commitment: felt252,
    ) -> u64 {
        assert(!token.is_zero(), 'token required');
        assert(amount > 0, 'amount required');
        assert(recipient_commitment != 0, 'commitment required');

        let caller = get_caller_address();
        let route_id = self.next_route_id.read();
        self.next_route_id.write(route_id + 1);
        self.routes.write(route_id, Route {
            creator: caller,
            token,
            amount,
            recipient_commitment,
            status: 1_u8,
            settlement_commitment: 0,
        });
        self.emit(RouteCreated { route_id, creator: caller, token, amount, recipient_commitment });
        route_id
    }

    #[external(v0)]
    fn record_settlement(
        ref self: ContractState,
        route_id: u64,
        settlement_commitment: felt252,
    ) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'only owner');
        assert(settlement_commitment != 0, 'settlement required');
        let mut route = self.routes.read(route_id);
        assert(route.status == 1_u8, 'route not active');
        route.status = 2_u8;
        route.settlement_commitment = settlement_commitment;
        self.routes.write(route_id, route);
        self.emit(RouteSettled { route_id, settlement_commitment });
    }

    #[external(v0)]
    fn cancel_route(ref self: ContractState, route_id: u64) {
        let caller = get_caller_address();
        let mut route = self.routes.read(route_id);
        assert(route.creator == caller, 'only creator');
        assert(route.status == 1_u8, 'route not active');
        route.status = 3_u8;
        self.routes.write(route_id, route);
    }

    #[external(v0)]
    fn get_route_status(self: @ContractState, route_id: u64) -> u8 {
        self.routes.read(route_id).status
    }

    #[external(v0)]
    fn get_recipient_commitment(self: @ContractState, route_id: u64) -> felt252 {
        self.routes.read(route_id).recipient_commitment
    }

    #[external(v0)]
    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }
}


#[cfg(test)]
mod tests;
