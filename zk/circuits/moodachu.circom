pragma circom 2.0.0;

template Moodachu() {
    signal private input secret; // Still keep secret as a private input for structure
    signal public input claimedState;

    (claimedState - 0) * (claimedState - 1) * (claimedState - 2) * (claimedState - 3) * (claimedState - 4) === 0;
}

component main = Moodachu();
