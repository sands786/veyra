use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use super::{IVeyraAgentCoordinatorDispatcher, IVeyraAgentCoordinatorDispatcherTrait};

#[test]
fn deploys_with_empty_round_state() {
    let declaration = declare("VeyraAgentCoordinator").unwrap();
    let (contract_address, _) = declaration.contract_class().deploy(@array![]).unwrap();
    let dispatcher = IVeyraAgentCoordinatorDispatcher { contract_address };

    assert(dispatcher.get_round_state(1_u64) == 0_u8, 'draft unknown round');
    assert(dispatcher.get_commitment(1_u64, 1_u64, contract_address) == 0, 'empty commitment');
    assert(dispatcher.get_reveal(1_u64, 1_u64, contract_address) == 0, 'empty reveal');
}
