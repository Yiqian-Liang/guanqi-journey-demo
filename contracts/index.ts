/** v0.4 TYPE CONTRACT ONLY. Runtime validators, game, network and save adapters still need implementation. */
export type Stem = '甲'|'乙'|'丙'|'丁'|'戊'|'己'|'庚'|'辛'|'壬'|'癸';
export type Branch = '子'|'丑'|'寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥';
/** The template type does NOT validate parity or cross-pillar constraints. */
export type Ganzhi = `${Stem}${Branch}`;
export type Element = 'wood'|'fire'|'earth'|'metal'|'water';
export type PillarKey = 'year'|'month'|'day'|'hour';
export type ActorId = string;
export type NodeId = string;
export type TenGod = '比肩'|'劫财'|'食神'|'伤官'|'偏财'|'正财'|'七杀'|'正官'|'偏印'|'正印';
export type ShenshaId = 'tianyi'|'tiande'|'yuede'|'taiji'|'lu'|'yima'|'huagai'|'jiangxing'|'xianchi'|'yangren'|'jiesha'|'xunkong';
export type EvidenceDomain = 'natal'|'transit'|'partner'|'place_legend';
export interface NatalChart {
 readonly mode: 'structural_ganzhi'|'authored_ganzhi';
 readonly calendarVerified: false;
 readonly year: Ganzhi; readonly month: Ganzhi; readonly day: Ganzhi; readonly hour: Ganzhi;
}
export interface Selection {readonly yearCycle:number; readonly monthBranch:number; readonly dayCycle:number; readonly hourBranch:number;}
export interface CreationLocks {readonly yearCycle?:number;readonly monthBranch?:number;readonly dayCycle?:number;readonly hourBranch?:number;readonly dayStem?:Stem;}
export type CreationOrigin =
 | Readonly<{kind:'random';algorithmVersion:'gq-structural-mulberry32-v1';seedHex:string;locks:CreationLocks}>
 | Readonly<{kind:'custom'}>
 | Readonly<{kind:'template';templateId:string}>
 | Readonly<{kind:'code';importedCode:string}>
 | Readonly<{kind:'legacy_preset';templateId:string;fromSchema:1}>
 | Readonly<{kind:'migrated_unknown';fromSchema:3;reason:'origin_not_recorded'}>
 | Readonly<{kind:'authored_npc';contentId:string}>;
export interface ActorIdentity {
 readonly id:ActorId; readonly kind:'human'|'npc'; readonly displayName:string; readonly appearanceId:string;
 readonly chart:NatalChart; readonly chartCode:string; readonly chartRulesVersion:'gq-structural-v1';
 readonly balanceProfileId:'GQ-BALANCE-0.4'; readonly origin:CreationOrigin;
}
export interface SourceNode {readonly id:NodeId;readonly ownerId:ActorId;readonly pillar:PillarKey;readonly stem:Stem;readonly element:Element;readonly visibility:'visible'|'hidden';readonly branch?:Branch;readonly parentBranchId?:NodeId;readonly budgetUnits:number;}
export interface RelationEdge {readonly id:string;readonly kind:'same_stem_root'|'same_element_support'|'exposed_hidden'|'stem_combine'|'branch_combine'|'branch_clash'|'branch_harm'|'branch_break'|'punishment'|'self_punishment'|'trine'|'directional_meeting';readonly nodeIds:readonly NodeId[];readonly directed:boolean;readonly complete:boolean;readonly domain:'natal'|'cross_actor';readonly ruleProfileId:string;readonly transformation:'not_adjudicated';}
export interface TenGodProfile {readonly observerId:ActorId;readonly targetId:ActorId;readonly observerDayStem:Stem;readonly visibleCounts:Readonly<Record<TenGod,number>>;readonly hiddenCounts:Readonly<Record<TenGod,number>>;readonly sourceBudgetUnits:Readonly<Record<TenGod,number>>;readonly excludesObserverDayNode:boolean;}
export interface ChartAnalysis {readonly cultureProfileId:string;readonly balanceProfileId:string;readonly ownerId:ActorId;readonly nodes:readonly SourceNode[];readonly edges:readonly RelationEdge[];readonly elementBudgetUnits:Readonly<Record<Element,number>>;readonly natalMonthBranch:Branch;readonly seasonDepth:'unknown';}
export interface MatchProof {readonly anchorNodeId:NodeId;readonly targetNodeId:NodeId;readonly ruleId:ShenshaId;readonly ruleProfileId:string;readonly sourceRefs:readonly string[];}
export interface ShenshaOccurrence {readonly key:string;readonly ownerId:ActorId;readonly shenshaId:ShenshaId;readonly domain:EvidenceDomain;readonly ruleProfileId:string;readonly carrierNodeId:NodeId;readonly proofs:readonly MatchProof[];}
export interface ShenshaResult {readonly disposition:'present'|'absent'|'not_applicable';readonly ruleId:ShenshaId;readonly occurrences:readonly ShenshaOccurrence[];}
export interface ShenshaRuntime {readonly occurrenceKey:string;readonly knowledge:'unknown'|'hinted'|'identified';readonly phase:'dormant'|'eligible'|'manifesting'|'engaged'|'cooldown';readonly obstructions:readonly ('context_unavailable'|'conflict_unresolved'|'evidence_incomplete')[];readonly eventInstanceId?:string;readonly cooldownUntilTick?:number;}
export type FlagValue = boolean|string|number;
export type Condition =
 | Readonly<{op:'constant';value:boolean}>
 | Readonly<{op:'all'|'any';args:readonly Condition[]}>
 | Readonly<{op:'not';arg:Condition}>
 | Readonly<{op:'ref';id:string}>
 | Readonly<{op:'flag';key:string;equals:FlagValue}>
 | Readonly<{op:'mechanism';key:string;equals:FlagValue}>
 | Readonly<{op:'item';id:string;atLeast:number}>
 | Readonly<{op:'clue'|'status';id:string}>
 | Readonly<{op:'phase';in:readonly number[]}>
 | Readonly<{op:'environment';metric:'fog'|'herbHealth'|'water'|'air';compare:'lt'|'lte'|'eq'|'gte'|'gt';value:number}>
 | Readonly<{op:'shensha';id:ShenshaId;domains:readonly EvidenceDomain[];owner:'self'}>
 | Readonly<{op:'npcAvailable';id:ActorId}>;
export type Effect =
 | Readonly<{op:'setFlag'|'setMechanism';key:string;value:FlagValue}>
 | Readonly<{op:'grantClue'|'learnSkill';id:string}>
 | Readonly<{op:'grantItem'|'spendItem';id:string;quantity:number}>
 | Readonly<{op:'addStatus';id:string;durationTicks:number}>
 | Readonly<{op:'setSocial';npcId:ActorId;playerId:ActorId;value:'unknown'|'acquainted'|'trusted'|'estranged'}>;
export interface Position {readonly roomId:string;readonly layer:number;readonly x:number;readonly y:number;}
export interface ActiveStatus {readonly id:string;readonly ownerId:ActorId;readonly startedAtTick:number;readonly expiresAtTick:number;readonly sourceEventId:string;}
export interface ActorState {readonly position:Position;readonly safeNodeId:NodeId;readonly health:number;readonly spirit:number;readonly focus:number;readonly learnedSkillIds:readonly string[];readonly cooldownUntil:Readonly<Record<string,number>>;readonly statuses:readonly ActiveStatus[];}
export interface TravelContract {readonly id:string;readonly npcId:ActorId;readonly inviterId:ActorId;readonly mode:'temporary'|'contract'|'migration_grace';readonly destinationNodeIds:readonly NodeId[];readonly acceptedAtTick:number;readonly endsAtTick?:number;readonly endConditionIds:readonly string[];}
export interface NpcState {readonly actorId:ActorId;readonly socialByPlayer:Readonly<Record<ActorId,'unknown'|'acquainted'|'trusted'|'estranged'>>;readonly travel:'independent'|'local_assist'|'eligible'|'invited'|'following_temporary'|'following_contract'|'departing';readonly obligationIds:readonly string[];readonly scheduleNodeId:NodeId;readonly contractId?:string;}
export interface Party {readonly id:string;readonly humanActorIds:readonly ActorId[];readonly npcActorIds:readonly ActorId[];readonly totalActorCap:3;readonly activeContracts:readonly TravelContract[];}
export interface EncounterReceipt {readonly worldSeed:string;readonly npcId:ActorId;readonly eligibleWindowId:string;readonly attemptIndex:number;readonly probabilityBasisPoints:number;readonly hashWordHex:string;readonly encountered:boolean;readonly pityUsed:boolean;}
export interface EnvironmentState {readonly gateRepaired:boolean;readonly rootMode:'blocked'|'trimmed'|'shaped'|'bypassed';readonly ventState:'closed'|'notch'|'open';readonly herbShield:boolean;}
export interface EnvironmentSnapshot {readonly water:number;readonly air:number;readonly fog:number;readonly herbHealth:number;readonly inputUnits:number;readonly herbOutput:number;readonly ferryOutput:number;readonly spillOutput:number;}
export interface RouteLease {readonly id:string;readonly edgeId:string;readonly actorId:ActorId;readonly enteredFromNode:NodeId;readonly expiresAtTick:number;readonly phase:'active'|'grace';}
export interface EventState {readonly id:string;readonly familyId:ShenshaId;readonly worldId:string;readonly participantIds:readonly ActorId[];readonly stage:string;readonly phase:'dormant'|'eligible'|'manifesting'|'engaged'|'cooldown'|'resolved';readonly frozenProofKeys:readonly string[];readonly obstructions:readonly string[];readonly startedAtTick:number;}
export interface RewardReceipt {readonly worldId:string;readonly playerId:ActorId;readonly eventId:string;readonly rewardId:string;readonly committedAtTick:number;}
export interface EndingSnapshot {readonly contentVersion:string;readonly firstEntryMethod:'water'|'wind'|'trace'|'mixed';readonly environment:EnvironmentSnapshot;readonly partyActorIds:readonly ActorId[];readonly worldTick:number;readonly legacy:boolean;}
export interface SaveGame {
 readonly schemaVersion:4;readonly contentVersion:'0.4.0';readonly cultureProfileId:'GQ-CULTURE-0.3';readonly balanceProfileId:'GQ-BALANCE-0.4';readonly environmentProfileId:'GQ-ENV-0.4';
 readonly worldId:string;readonly worldSeed:string;readonly primaryPlayerId:ActorId;readonly identities:Readonly<Record<ActorId,ActorIdentity>>;readonly actors:Readonly<Record<ActorId,ActorState>>;
 readonly worldTick:number;readonly worldRevision:number;readonly environment:EnvironmentState;readonly questFacts:Readonly<Record<string,FlagValue>>;
 readonly inventoryByActor:Readonly<Record<ActorId,Readonly<Record<string,number>>>>;readonly cluesByActor:Readonly<Record<ActorId,readonly string[]>>;readonly visitedNodesByActor:Readonly<Record<ActorId,readonly NodeId[]>>;
 readonly npcStates:readonly NpcState[];readonly party:Party;readonly encounterReceipts:readonly EncounterReceipt[];readonly encounterAttempts:Readonly<Record<string,number>>;
 readonly eventStates:readonly EventState[];readonly shenshaRuntime:readonly ShenshaRuntime[];readonly rewardReceipts:readonly RewardReceipt[];readonly routeLeases:readonly RouteLease[];
 readonly objectStates:Readonly<Record<string,Readonly<Record<string,FlagValue>>>>;readonly consumedUniqueItemIds:readonly string[];readonly firstEndingSnapshot:EndingSnapshot|null;
}
export interface Envelope {readonly commandId:string;readonly worldId:string;readonly actorId:ActorId;}
export type DiscretePayload =
 | Readonly<{kind:'cast';skillId:string;targetId:string;sourceNodeId?:NodeId;supportNodeId?:NodeId;supportActorId?:ActorId;mode?:string}>
 | Readonly<{kind:'interact';interactionId:string;targetId:string}>
 | Readonly<{kind:'invite';npcId:ActorId;destinationNodeIds:readonly NodeId[];mode:'temporary'|'contract'}>
 | Readonly<{kind:'accept_invitation';invitationId:string}>
 | Readonly<{kind:'leave_party';actorToLeave:ActorId}>
 | Readonly<{kind:'event_choice';eventInstanceId:string;choiceId:string}>
 | Readonly<{kind:'propose_wait';targetPhase:number}>
 | Readonly<{kind:'ready_for_wait';proposalId:string}>;
export type Command = (Envelope & Readonly<{expectedRevision:number;action:DiscretePayload}>)
 | (Envelope & Readonly<{action:{readonly kind:'move';readonly inputSequence:number;readonly dx:number;readonly dy:number;readonly observedRevision:number}}>);
export type Result<T> = Readonly<{ok:true;value:T}> | Readonly<{ok:false;code:string;message:string;paths:readonly string[]}>;
export interface CommandResult {readonly commandId:string;readonly status:'committed'|'rejected'|'duplicate';readonly worldRevision:number;readonly eventIds:readonly string[];readonly reason?:string;}
export interface DomainAPI {
 deriveChart(selection:Selection):Result<NatalChart>;
 generateChart(seedHex:string,locks:CreationLocks):Result<{selection:Selection;chart:NatalChart;origin:CreationOrigin}>;
 encodeChart(chart:NatalChart):Result<string>;
 decodeChart(code:string):Result<NatalChart>;
 analyzeChart(ownerId:ActorId,chart:NatalChart):Result<ChartAnalysis>;
 getTenGod(observer:Stem,target:Stem):TenGod;
 getTenGodProfile(observerId:ActorId,targetId:ActorId,identities:Readonly<Record<ActorId,ActorIdentity>>):Result<TenGodProfile>;
 detectNatalShensha(ownerId:ActorId,chart:NatalChart):Result<readonly ShenshaResult[]>;
 deriveEnvironment(state:EnvironmentState,phase:number):Result<EnvironmentSnapshot>;
 applyCommand(state:SaveGame,command:Command):Result<{state:SaveGame;receipt:CommandResult}>;
 validateSave(raw:unknown):Result<SaveGame>;
 migrateSave(raw:unknown):Result<SaveGame>;
}
