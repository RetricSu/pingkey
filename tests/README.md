# DID SDK Test Suite

This directory contains tests for the DID SDK functionality, specifically testing the encode/decode correspondence of Web5 DID strings.

## 🧪 Test Coverage

The test suite covers:

- **Encode/Decode Correspondence**: Ensures that `encodeWeb5DIDString()` and `decodeWeb5DIDString()` functions work correctly together
- **Edge Cases**: Tests with various hex identifier lengths and patterns
- **Data Integrity**: Verifies that no data is lost during the encoding/decoding process
- **Base32 Encoding**: Tests the proper handling of binary data with the base32 library

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm run test:did

# Or directly
npm test
```

### Available Commands

```bash
# Run all tests
npm run test:did

# Interactive mode (test your own hex values)
npm run test:did-interactive

# Run specific test by name
npm run test:did -- -t "short hex"

# Show help
npm run test:did-help
```

### Direct Node.js Execution

```bash
# Run all tests
node tests/did-sdk.test.js

# Interactive mode
node tests/did-sdk.test.js --interactive

# Run specific test
node tests/did-sdk.test.js -t "Common hex pattern"

# Show help
node tests/did-sdk.test.js --help
```

## 📋 Test Cases

| Test Case | Description | Example Input |
|-----------|-------------|---------------|
| Short hex string | Basic functionality test | `0x1234abcd` |
| 20 bytes of zeros | Minimum identifier test | `0x0000...0000` |
| Common hex pattern | Real-world pattern | `0xdeadbeef` |
| 20 bytes of 0xff | Maximum identifier test | `0xffff...ffff` |
| Mixed case hex | Case handling test | `0xAbCdEf123456` |
| Real-world identifier | Realistic 20-byte ID | `0x742d35cc...` |
| Single byte | Boundary test | `0x42` |
| Two bytes | Boundary test | `0x4242` |

## 🔧 Interactive Mode

The interactive mode allows you to test your own hex identifiers:

```bash
npm run test:did-interactive
```

This will prompt you to enter hex identifiers and will show the encode/decode results in real-time.

## 🛠️ Maintenance

### Adding New Test Cases

To add new test cases, edit `tests/did-sdk.test.js` and add entries to the `testCases` array in the constructor:

```javascript
{
  name: "Your test name",
  input: "0x1234...",
  description: "Description of what this test covers"
}
```

### Updating for Code Changes

When the DID SDK encode/decode functions are modified:

1. Update the replicated functions in the test file to match the new implementation
2. Add new test cases if new functionality is added
3. Run the tests to ensure everything still works

### Integration with CI/CD

To integrate with continuous integration:

```yaml
# Example GitHub Actions step
- name: Run DID SDK Tests
  run: npm run test:did
```

## 🐛 Troubleshooting

### Common Issues

1. **Test fails after modifying DID SDK**: Update the test functions to match the new implementation
2. **Base32 library issues**: Ensure the base32 dependency is properly installed
3. **Node.js version**: Tests require Node.js with Buffer and readline support

### Expected Output

Successful test run should show:
```
🧪 DID SDK Encode/Decode Test Suite
==================================================
✅ Short hex string: PASSED
✅ 20 bytes of zeros: PASSED
...
==================================================
📊 Test Results: 8 passed, 0 failed
```

## 📚 Background

This test suite was created to catch encode/decode bugs in the DID SDK, specifically issues with:

- **Base32 encoding/decoding correspondence**
- **Binary data handling with the base32 library**
- **Hex string processing**
- **Case sensitivity handling**

The tests ensure that any hex identifier can be:
1. Encoded to a Web5 DID string
2. Decoded back to the original hex identifier
3. Maintain perfect data integrity throughout the process

## 🔄 Future Enhancements

Potential improvements for the test suite:

- [ ] Add performance benchmarks
- [ ] Test with the actual DIDSDK class (not just replicated functions)
- [ ] Add property-based testing with random hex values
- [ ] Integration tests with blockchain operations
- [ ] Add TypeScript support for better type safety 
