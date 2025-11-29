pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";

// ==========================================================
// WRAPPERS
// ==========================================================

// circomlib equality uses eq.in[2]
template EQ() {
    signal input a;
    signal input b;
    signal output out;

    component eq = IsEqual();
    eq.in[0] <== a;
    eq.in[1] <== b;

    out <== eq.out;
}


// a >= b → compare b <= a
template GreaterEq() {
    signal input a;
    signal input b;
    signal output out;

    component cmp = LessEqThan(8);
    cmp.in[0] <== b;
    cmp.in[1] <== a;

    out <== cmp.out;
}


// a <= b
template LessEq() {
    signal input a;
    signal input b;
    signal output out;

    component cmp = LessEqThan(8);
    cmp.in[0] <== a;
    cmp.in[1] <== b;

    out <== cmp.out;
}


// low <= x <= high
template IsInRange() {
    signal input x;
    signal input low;
    signal input high;
    signal output out;

    component ge = GreaterEq();
    ge.a <== x;
    ge.b <== low;

    component le = LessEq();
    le.a <== x;
    le.b <== high;

    out <== ge.out * le.out;
}


// ==========================================================
// MAIN CIRCUIT
// ==========================================================

template Main() {

    signal input tagA;
    signal input tagB;
    signal input interactionType;
    signal output pet_state;

    // ======================================================
    // INPUT VALIDITY (quadratic-safe)
    // ======================================================

    // --- tagA, tagB ∈ [0..6] ---

    component tagA_ge0 = GreaterEq(); tagA_ge0.a <== tagA; tagA_ge0.b <== 0;
    component tagA_le6 = LessEq();    tagA_le6.a <== tagA; tagA_le6.b <== 6;

    component tagB_ge0 = GreaterEq(); tagB_ge0.a <== tagB; tagB_ge0.b <== 0;
    component tagB_le6 = LessEq();    tagB_le6.a <== tagB; tagB_le6.b <== 6;

    signal vA;
    signal vB;
    vA <== tagA_ge0.out * tagA_le6.out;
    vB <== tagB_ge0.out * tagB_le6.out;

    signal validTags;
    validTags <== vA * vB;
    validTags === 1;

    // --- interactionType ∈ {0, 100, 101} ---

    component eqInt0      = EQ(); eqInt0.a      <== interactionType; eqInt0.b      <== 0;
    component eqIntStroke = EQ(); eqIntStroke.a <== interactionType; eqIntStroke.b <== 100;
    component eqIntFeed   = EQ(); eqIntFeed.a   <== interactionType; eqIntFeed.b   <== 101;

    signal validInteraction;
    validInteraction <== eqInt0.out + eqIntStroke.out + eqIntFeed.out;
    validInteraction === 1;


    // ======================================================
    // TAG COMPARATORS
    // ======================================================

    component happyA = EQ(); happyA.a <== tagA; happyA.b <== 0;
    component happyB = EQ(); happyB.a <== tagB; happyB.b <== 0;

    component stressA = EQ(); stressA.a <== tagA; stressA.b <== 1;
    component stressB = EQ(); stressB.a <== tagB; stressB.b <== 1;

    component growA = EQ(); growA.a <== tagA; growA.b <== 4;
    component growB = EQ(); growB.a <== tagB; growB.b <== 4;

    // TAGS 2..4 → oneLow
    component lowA = IsInRange();
    lowA.x <== tagA; lowA.low <== 2; lowA.high <== 4;

    component lowB = IsInRange();
    lowB.x <== tagB; lowB.low <== 2; lowB.high <== 4;

    // XOR = A + B - 2AB (degree 2)
    signal bothLow;
    bothLow <== lowA.out * lowB.out;
    signal oneLow;
    oneLow <== lowA.out + lowB.out - 2 * bothLow;


    // interaction hit
    component stroke = EQ(); stroke.a <== interactionType; stroke.b <== 100;
    component feed   = EQ(); feed.a   <== interactionType; feed.b   <== 101;

    signal interactionHit;
    interactionHit <== stroke.out + feed.out;

    // emotion combinations
    signal bothHappy;    bothHappy    <== happyA.out  * happyB.out;
    signal bothStressed; bothStressed <== stressA.out * stressB.out;
    signal bothGrow;     bothGrow     <== growA.out   * growB.out;


    // ======================================================
    // ENCODE STATE VALUES
    // ======================================================

    // numeric constants (allowed)
    signal selInteraction; selInteraction <== 1;
    signal selStorm;       selStorm       <== 3;
    signal selSleepy;      selSleepy      <== 2;
    signal selGrowState;   selGrowState   <== 4;
    signal selDance;       selDance       <== 1;


    // ======================================================
    // PRIORITY MUX (quadratic-safe)
    // ======================================================

    // --- grow vs dance ---
    signal g1; signal g2; signal g3; signal step_grow_dance;
    g1 <== bothGrow * selGrowState;
    g2 <== 1 - bothGrow;
    g3 <== g2 * selDance;
    step_grow_dance <== g1 + g3;

    // --- sleepy vs (grow/dance) ---
    signal s1; signal s2; signal s3; signal step_sleepy;
    s1 <== oneLow * selSleepy;
    s2 <== 1 - oneLow;
    s3 <== s2 * step_grow_dance;
    step_sleepy <== s1 + s3;

    // --- storm vs previous ---
    signal st1; signal st2; signal st3; signal step_storm;
    st1 <== bothStressed * selStorm;
    st2 <== 1 - bothStressed;
    st3 <== st2 * step_sleepy;
    step_storm <== st1 + st3;

    // --- interaction override ---
    signal i1; signal i2; signal i3; signal step_interaction;
    i1 <== interactionHit * selInteraction;
    i2 <== 1 - interactionHit;
    i3 <== i2 * step_storm;
    step_interaction <== i1 + i3;

    pet_state <== step_interaction;
}

component main = Main();
