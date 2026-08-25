use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::contract_address_const;
use super::{IVeyraPrivateMarketsDispatcher, IVeyraPrivateMarketsDispatcherTrait};

#[test]
fn deploys_with_a_nonzero_token_and_starts_empty() {
    let token = contract_address_const::<2>();
    let declaration = declare("VeyraPrivateMarkets").unwrap();
    let (contract_address, _) = declaration.contract_class().deploy(@array![token.into()]).unwrap();
    let dispatcher = IVeyraPrivateMarketsDispatcher { contract_address };

    assert(dispatcher.get_market_state(1_u64) == 0_u8, 'draft unknown market');
    let committed = dispatcher.get_market_committed(1_u64);
    assert(committed.low == 0_u128, 'committed low zero');
    assert(committed.high == 0_u128, 'committed high zero');
    assert(dispatcher.get_bid_state(1_u64, 1_u64) == 0_u8, 'committed unknown bid');
}
