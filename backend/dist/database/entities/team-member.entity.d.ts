export declare class TeamMemberEntity {
    id: number;
    teamId: string;
    userId: string;
    role: 'leader' | 'member';
    joinedAt: Date;
}
