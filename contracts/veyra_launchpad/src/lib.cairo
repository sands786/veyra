use starknet::ContractAddress;

#[starknet::interface]
trait IVeyraLaunchpadEscrow<TContractState> {
    fn create_project(ref self: TContractState, project_id: u64, creator: ContractAddress);
    fn activate_project(ref self: TContractState, project_id: u64);
    fn deposit(ref self: TContractState, project_id: u64, amount: u256);
    fn reserve_allocation(ref self: TContractState, project_id: u64, allocation_id: u64, beneficiary: ContractAddress, amount: u256);
    fn approve_milestone(ref self: TContractState, project_id: u64, milestone_id: u64, allocation_id: u64);
    fn release_milestone(ref self: TContractState, project_id: u64, milestone_id: u64);
    fn refund(ref self: TContractState, project_id: u64, amount: u256);
    fn get_project_state(self: @TContractState, project_id: u64) -> u8;
    fn get_project_balance(self: @TContractState, project_id: u64) -> u256;
    fn get_deposit(self: @TContractState, project_id: u64, account: ContractAddress) -> u256;
    fn get_milestone_state(self: @TContractState, project_id: u64, milestone_id: u64) -> u8;
}

#[starknet::contract]
mod VeyraLaunchpadEscrow {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    const PROJECT_DRAFT: u8 = 0_u8;
    const PROJECT_ACTIVE: u8 = 1_u8;
    const PROJECT_CLOSED: u8 = 2_u8;
    const MILESTONE_PLANNED: u8 = 0_u8;
    const MILESTONE_APPROVED: u8 = 1_u8;
    const MILESTONE_RELEASED: u8 = 2_u8;

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Project {
        creator: ContractAddress,
        balance: u256,
        reserved: u256,
        released: u256,
        state: u8,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Allocation {
        beneficiary: ContractAddress,
        amount: u256,
        released: bool,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Milestone {
        allocation_id: u64,
        state: u8,
    }

    #[storage]
    struct Storage {
        token: ContractAddress,
        projects: Map<u64, Project>,
        project_exists: Map<u64, bool>,
        deposits: Map<(u64, ContractAddress), u256>,
        allocations: Map<(u64, u64), Allocation>,
        milestones: Map<(u64, u64), Milestone>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProjectCreated: ProjectCreated,
        ProjectActivated: ProjectActivated,
        Deposited: Deposited,
        AllocationReserved: AllocationReserved,
        MilestoneApproved: MilestoneApproved,
        MilestoneReleased: MilestoneReleased,
        Refunded: Refunded,
    }

    #[derive(Drop, starknet::Event)]
    struct ProjectCreated {
        #[key]
        project_id: u64,
        creator: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ProjectActivated {
        #[key]
        project_id: u64,
        creator: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposited {
        #[key]
        project_id: u64,
        depositor: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct AllocationReserved {
        #[key]
        project_id: u64,
        #[key]
        allocation_id: u64,
        beneficiary: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneApproved {
        #[key]
        project_id: u64,
        #[key]
        milestone_id: u64,
        allocation_id: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneReleased {
        #[key]
        project_id: u64,
        #[key]
        milestone_id: u64,
        beneficiary: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Refunded {
        #[key]
        project_id: u64,
        account: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, token: ContractAddress) {
        assert(!token.is_zero(), 'token required');
        self.token.write(token);
    }

    #[external(v0)]
    fn create_project(ref self: ContractState, project_id: u64, creator: ContractAddress) {
        let caller = get_caller_address();
        assert(!creator.is_zero(), 'creator required');
        assert(caller == creator, 'creator must sign');
        assert(!self.project_exists.read(project_id), 'project exists');
        self.project_exists.write(project_id, true);
        self.projects.write(project_id, Project { creator, balance: 0, reserved: 0, released: 0, state: PROJECT_DRAFT });
        self.emit(ProjectCreated { project_id, creator });
    }

    #[external(v0)]
    fn activate_project(ref self: ContractState, project_id: u64) {
        let caller = get_caller_address();
        let mut project = self.projects.read(project_id);
        assert(self.project_exists.read(project_id), 'project missing');
        assert(project.state == PROJECT_DRAFT, 'project not draft');
        assert(project.creator == caller, 'only creator');
        project.state = PROJECT_ACTIVE;
        self.projects.write(project_id, project);
        self.emit(ProjectActivated { project_id, creator: caller });
    }

    #[external(v0)]
    fn deposit(ref self: ContractState, project_id: u64, amount: u256) {
        let caller = get_caller_address();
        let mut project = self.projects.read(project_id);
        assert(self.project_exists.read(project_id), 'project missing');
        assert(project.state == PROJECT_ACTIVE, 'project not active');
        assert(amount > 0, 'amount required');
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer_from(caller, get_contract_address(), amount), 'token transfer failed');
        project.balance = project.balance + amount;
        self.projects.write(project_id, project);
        let current = self.deposits.read((project_id, caller));
        self.deposits.write((project_id, caller), current + amount);
        self.emit(Deposited { project_id, depositor: caller, amount });
    }

    #[external(v0)]
    fn reserve_allocation(ref self: ContractState, project_id: u64, allocation_id: u64, beneficiary: ContractAddress, amount: u256) {
        let caller = get_caller_address();
        let mut project = self.projects.read(project_id);
        assert(project.state == PROJECT_ACTIVE, 'project not active');
        assert(project.creator == caller, 'only creator');
        assert(!beneficiary.is_zero(), 'beneficiary required');
        assert(amount > 0, 'amount required');
        assert(self.allocations.read((project_id, allocation_id)).amount == 0, 'allocation used');
        assert(project.balance - project.reserved >= amount, 'insufficient available escrow');
        self.allocations.write((project_id, allocation_id), Allocation { beneficiary, amount, released: false });
        project.reserved = project.reserved + amount;
        self.projects.write(project_id, project);
        self.emit(AllocationReserved { project_id, allocation_id, beneficiary, amount });
    }

    #[external(v0)]
    fn approve_milestone(ref self: ContractState, project_id: u64, milestone_id: u64, allocation_id: u64) {
        let caller = get_caller_address();
        let project = self.projects.read(project_id);
        assert(project.state == PROJECT_ACTIVE, 'project not active');
        assert(project.creator == caller, 'only creator');
        let allocation = self.allocations.read((project_id, allocation_id));
        assert(allocation.amount > 0, 'allocation missing');
        let current = self.milestones.read((project_id, milestone_id));
        assert(current.state == 0, 'milestone decided');
        self.milestones.write((project_id, milestone_id), Milestone { allocation_id, state: MILESTONE_APPROVED });
        self.emit(MilestoneApproved { project_id, milestone_id, allocation_id });
    }

    #[external(v0)]
    fn release_milestone(ref self: ContractState, project_id: u64, milestone_id: u64) {
        let caller = get_caller_address();
        let project = self.projects.read(project_id);
        assert(project.state == PROJECT_ACTIVE, 'project not active');
        assert(project.creator == caller, 'only creator');
        let milestone = self.milestones.read((project_id, milestone_id));
        assert(milestone.state == MILESTONE_APPROVED, 'milestone not approved');
        let mut allocation = self.allocations.read((project_id, milestone.allocation_id));
        assert(!allocation.released, 'allocation released');
        let mut updated = project;
        assert(updated.balance >= allocation.amount, 'insufficient escrow');
        updated.balance = updated.balance - allocation.amount;
        updated.reserved = updated.reserved - allocation.amount;
        updated.released = updated.released + allocation.amount;
        allocation.released = true;
        self.projects.write(project_id, updated);
        self.allocations.write((project_id, milestone.allocation_id), allocation);
        self.milestones.write((project_id, milestone_id), Milestone { allocation_id: milestone.allocation_id, state: MILESTONE_RELEASED });
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer(allocation.beneficiary, allocation.amount), 'token transfer failed');
        self.emit(MilestoneReleased { project_id, milestone_id, beneficiary: allocation.beneficiary, amount: allocation.amount });
    }

    #[external(v0)]
    fn refund(ref self: ContractState, project_id: u64, amount: u256) {
        let caller = get_caller_address();
        assert(amount > 0, 'amount required');
        let mut project = self.projects.read(project_id);
        assert(project.state == PROJECT_ACTIVE, 'project not active');
        assert(project.reserved == 0, 'refund locked after allocation');
        let deposited = self.deposits.read((project_id, caller));
        assert(deposited >= amount, 'refund exceeds deposit');
        assert(project.balance >= amount, 'insufficient escrow');
        project.balance = project.balance - amount;
        self.projects.write(project_id, project);
        self.deposits.write((project_id, caller), deposited - amount);
        let token = IERC20Dispatcher { contract_address: self.token.read() };
        assert(token.transfer(caller, amount), 'token transfer failed');
        self.emit(Refunded { project_id, account: caller, amount });
    }

    #[external(v0)]
    fn get_project_state(self: @ContractState, project_id: u64) -> u8 { self.projects.read(project_id).state }

    #[external(v0)]
    fn get_project_balance(self: @ContractState, project_id: u64) -> u256 { self.projects.read(project_id).balance }

    #[external(v0)]
    fn get_deposit(self: @ContractState, project_id: u64, account: ContractAddress) -> u256 { self.deposits.read((project_id, account)) }

    #[external(v0)]
    fn get_milestone_state(self: @ContractState, project_id: u64, milestone_id: u64) -> u8 { self.milestones.read((project_id, milestone_id)).state }
}

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
}

#[cfg(test)]
mod tests;
