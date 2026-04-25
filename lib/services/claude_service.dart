class ClaudeService {
  ClaudeService(String apiKey);

  Future<String> findPolicyArticles(String issue) {
    throw UnimplementedError('旧版 Claude 直连能力已移除，请改为调用后端统一查询接口。');
  }
}
