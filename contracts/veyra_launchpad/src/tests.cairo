use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::contract_address_const;
use super::{IVeyraLaunchpadEscrowDispatcher, IVeyraLaunchpadEscrowDispatcherTrait};

#[test]
fn deploys_with_a_nonzero_token_and_starts_empty() {
    let token = contract_address_const::<2>();
    let declaration = declare("VeyraLaunchpadEscrow").unwrap();
    let (contract_address, _) = declaration.contract_class().deploy(@array![token.into()]).unwrap();
    let dispatcher = IVeyraLaunchpadEscrowDispatcher { contract_address };

    assert(dispatcher.get_project_state(1_u64) == 0_u8, 'draft unknown project');
    let balance = dispatcher.get_project_balance(1_u64);
    assert(balance.low == 0_u128, 'balance low zero');
    assert(balance.high == 0_u128, 'balance high zero');
    let deposit = dispatcher.get_deposit(1_u64, contract_address_const::<3>());
    assert(deposit.low == 0_u128, 'deposit low zero');
    assert(deposit.high == 0_u128, 'deposit high zero');
    assert(dispatcher.get_milestone_state(1_u64, 1_u64) == 0_u8, 'planned unknown milestone');
}
