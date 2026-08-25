use starknet::{ContractAddress, get_caller_address};
use core::poseidon::poseidon_hash_span;

#[starknet::interface]
trait IVeyraAgentCoordinator<TContractState> {
    fn create_round(ref self: TContractState, round_id: u64, coordinator: ContractAddress, round_type: felt252);
    fn open_round(ref self: TContractState, round_id: u64);
    fn commit(ref self: TContractState, round_id: u64, item_id: u64, commitment: felt252);
    fn close_round(ref self: TContractState, round_id: u64);
    fn reveal(ref self: TContractState, round_id: u64, item_id: u64, value: felt252, nonce: felt252);
    fn resolve(ref self: TContractState, round_id: u64, item_id: u64, winner: ContractAddress);
    fn get_round_state(self: @TContractState, round_id: u64) -> u8;
    fn get_commitment(self: @TContractState, round_id: u64, item_id: u64, participant: ContractAddress) -> felt252;
    fn get_reveal(self: @TContractState, round_id: u64, item_id: u64, participant: ContractAddress) -> felt252;
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Round {
    coordinator: ContractAddress,
    round_type: felt252,
    state: u8,
}

#[starknet::contract]
mod VeyraAgentCoordinator {
    use super::{poseidon_hash_span, ContractAddress, IVeyraAgentCoordinator, Round};
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    const DRAFT: u8 = 0;
    const OPEN: u8 = 1;
    const CLOSED: u8 = 2;
    const RESOLVED: u8 = 3;

    #[storage]
    struct Storage {
        rounds: Map<u64, Round>,
        commitments: Map<(u64, u64, ContractAddress), felt252>,
        reveals: Map<(u64, u64, ContractAddress), felt252>,
        resolved_items: Map<(u64, u64), ContractAddress>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RoundCreated: RoundCreated,
        RoundOpened: RoundOpened,
        CommitmentSubmitted: CommitmentSubmitted,
        RoundClosed: RoundClosed,
        ValueRevealed: ValueRevealed,
        ItemResolved: ItemResolved,
    }

    #[derive(Drop, starknet::Event)]
    struct RoundCreated { round_id: u64, coordinator: ContractAddress, round_type: felt252 }
    #[derive(Drop, starknet::Event)]
    struct RoundOpened { round_id: u64 }
    #[derive(Drop, starknet::Event)]
    struct CommitmentSubmitted { round_id: u64, item_id: u64, participant: ContractAddress, commitment: felt252 }
    #[derive(Drop, starknet::Event)]
    struct RoundClosed { round_id: u64 }
    #[derive(Drop, starknet::Event)]
    struct ValueRevealed { round_id: u64, item_id: u64, participant: ContractAddress, value: felt252 }
    #[derive(Drop, starknet::Event)]
    struct ItemResolved { round_id: u64, item_id: u64, winner: ContractAddress }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl VeyraAgentCoordinatorImpl of IVeyraAgentCoordinator<ContractState> {
        fn create_round(ref self: ContractState, round_id: u64, coordinator: ContractAddress, round_type: felt252) {
            assert(!coordinator.is_zero(), 'zero coordinator');
            assert(self.rounds.read(round_id).coordinator.is_zero(), 'round exists');
            self.rounds.write(round_id, Round { coordinator, round_type, state: DRAFT });
            self.emit(Event::RoundCreated(RoundCreated { round_id, coordinator, round_type }));
        }

        fn open_round(ref self: ContractState, round_id: u64) {
            let caller = get_caller_address();
            let mut round = self.rounds.read(round_id);
            assert(caller == round.coordinator, 'not coordinator');
            assert(round.state == DRAFT, 'bad round state');
            round.state = OPEN;
            self.rounds.write(round_id, round);
            self.emit(Event::RoundOpened(RoundOpened { round_id }));
        }

        fn commit(ref self: ContractState, round_id: u64, item_id: u64, commitment: felt252) {
            let caller = get_caller_address();
            let round = self.rounds.read(round_id);
            assert(round.state == OPEN, 'round not open');
            assert(commitment != 0, 'empty commitment');
            assert(self.commitments.read((round_id, item_id, caller)) == 0, 'already committed');
            self.commitments.write((round_id, item_id, caller), commitment);
            self.emit(Event::CommitmentSubmitted(CommitmentSubmitted { round_id, item_id, participant: caller, commitment }));
        }

        fn close_round(ref self: ContractState, round_id: u64) {
            let caller = get_caller_address();
            let mut round = self.rounds.read(round_id);
            assert(caller == round.coordinator, 'not coordinator');
            assert(round.state == OPEN, 'bad round state');
            round.state = CLOSED;
            self.rounds.write(round_id, round);
            self.emit(Event::RoundClosed(RoundClosed { round_id }));
        }

        fn reveal(ref self: ContractState, round_id: u64, item_id: u64, value: felt252, nonce: felt252) {
            let caller = get_caller_address();
            let round = self.rounds.read(round_id);
            assert(round.state == CLOSED, 'round not closed');
            let committed = self.commitments.read((round_id, item_id, caller));
            assert(committed != 0, 'missing commitment');
            let calculated = poseidon_hash_span(array![value, nonce].span());
            assert(calculated == committed, 'commitment mismatch');
            assert(self.reveals.read((round_id, item_id, caller)) == 0, 'already revealed');
            self.reveals.write((round_id, item_id, caller), value);
            self.emit(Event::ValueRevealed(ValueRevealed { round_id, item_id, participant: caller, value }));
        }

        fn resolve(ref self: ContractState, round_id: u64, item_id: u64, winner: ContractAddress) {
            let caller = get_caller_address();
            let round = self.rounds.read(round_id);
            assert(caller == round.coordinator, 'not coordinator');
            assert(round.state == CLOSED, 'bad round state');
            assert(!winner.is_zero(), 'zero winner');
            assert(self.resolved_items.read((round_id, item_id)).is_zero(), 'already resolved');
            assert(self.reveals.read((round_id, item_id, winner)) != 0, 'winner not revealed');
            self.resolved_items.write((round_id, item_id), winner);
            self.emit(Event::ItemResolved(ItemResolved { round_id, item_id, winner }));
        }

        fn get_round_state(self: @ContractState, round_id: u64) -> u8 { self.rounds.read(round_id).state }
        fn get_commitment(self: @ContractState, round_id: u64, item_id: u64, participant: ContractAddress) -> felt252 { self.commitments.read((round_id, item_id, participant)) }
        fn get_reveal(self: @ContractState, round_id: u64, item_id: u64, participant: ContractAddress) -> felt252 { self.reveals.read((round_id, item_id, participant)) }
    }
}

#[cfg(test)]
mod tests;
