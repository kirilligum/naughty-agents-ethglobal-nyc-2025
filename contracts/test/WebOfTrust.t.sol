import {Test} from "forge-std/Test.sol";
import {WebOfTrust} from "../WebOfTrust.sol";

contract WebOfTrustTest is Test {
    WebOfTrust public wot;
    address public genesis;
    address public alice = address(0x1);
    uint256 constant STAKE = 0.01 ether;

    function setUp() public {
        genesis = vm.addr(0x1234);
        vm.prank(genesis);
        wot = new WebOfTrust(STAKE);
    }

    function test_RegisterWithInvite() public {
        vm.prank(genesis);
        bytes32 code = wot.createInviteCode();

        vm.deal(alice, STAKE);
        vm.prank(alice);
        wot.register{value: STAKE}(code);

        assertTrue(wot.members(alice).isActive);
        assertEq(wot.members(alice).invitedBy, genesis);
    }

    function testFail_RegisterInsufficientStake() public {
        // ... setup code ...
        vm.prank(alice);
        // Fails because value < STAKE
        wot.register{value: STAKE - 1}(bytes32(0));
    }
}

