use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::contract_address_const;
use super::{IVeyraPayrollRegistryDispatcher, IVeyraPayrollRegistryDispatcherTrait};

#[test]
fn creates_a_private_route_and_stores_only_commitment_data() {
    let owner = contract_address_const::<1>();
    let token = contract_address_const::<2>();
    let declaration = declare("VeyraPayrollRegistry").unwrap();
    let (contract_address, _) = declaration.contract_class().deploy(@array![owner.into()]).unwrap();
    let dispatcher = IVeyraPayrollRegistryDispatcher { contract_address };

    let route_id = dispatcher.create_route(token, 2_840_u256, 123_456);
    assert(route_id == 1_u64, 'first route id');

    assert(dispatcher.get_owner() == owner, 'owner recorded');
    assert(dispatcher.get_route_status(route_id) == 1_u8, 'route active');
    assert(dispatcher.get_recipient_commitment(route_id) == 123_456, 'commitment recorded');
}
