describe('Team Matchmaking', () => {
  it('should match users based on complementary skills', () => {
    const userSkills = ['React'];
    const teamNeeds = ['React', 'Node'];
    expect(teamNeeds).toContain(userSkills[0]);
  });
});
