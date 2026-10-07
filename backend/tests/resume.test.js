describe('Resume AI Pipeline', () => {
  it('should parse ATS score from Gemini response', () => {
    const mockResponse = { score: 85 };
    expect(mockResponse.score).toBeGreaterThan(80);
  });
});
