#!/usr/bin/env node

/**
 * DID SDK Test Suite
 * 
 * Tests the encode/decode correspondence of Web5 DID strings
 * to ensure data integrity during conversion operations.
 * 
 * Run with: node tests/did-sdk.test.js
 * Or add to package.json scripts for integration with npm test
 */

const base32 = require('base32');

// Import the actual functions from the DID SDK
// Note: In a real test environment, you'd import the actual class
// For now, we'll replicate the exact logic to test it

/**
 * Replicate the exact encode function from DIDSDK
 */
function encodeWeb5DIDString(identifier) {
  if (identifier.startsWith("0x")) {
    identifier = identifier.slice(2);
  }
  // Convert hex to buffer, then to binary string for base32 encoding
  const bytes = Buffer.from(identifier, "hex");
  const binaryString = bytes.toString("binary");
  const id = base32.encode(binaryString).toLowerCase();
  return `did:web5:${id}`;
}

/**
 * Replicate the exact decode function from DIDSDK
 */
function decodeWeb5DIDString(did) {
  const id = did.split(":")[2];
  // The base32 library returns a string, but we need to treat it as binary data
  const decodedString = base32.decode(id.toUpperCase());
  // Convert the string to bytes by treating each character as a byte
  const bytes = Buffer.from(decodedString, "binary");
  const args = bytes.toString("hex");
  return ("0x" + args);
}

/**
 * Test suite for DID SDK encode/decode functionality
 */
class DIDSDKTestSuite {
  constructor() {
    this.testCases = [
      // Basic test cases
      {
        name: "Short hex string",
        input: "0x1234abcd",
        description: "Test with a short hex identifier"
      },
      {
        name: "20 bytes of zeros",
        input: "0x" + "00".repeat(20),
        description: "Test with minimum identifier (20 bytes of zeros)"
      },
      {
        name: "Common hex pattern",
        input: "0xdeadbeef",
        description: "Test with common hex pattern"
      },
      {
        name: "20 bytes of 0xff",
        input: "0x" + "ff".repeat(20),
        description: "Test with maximum identifier (20 bytes of 0xff)"
      },
      // Edge cases
      {
        name: "Mixed case hex",
        input: "0xAbCdEf123456",
        description: "Test with mixed case hex input"
      },
      {
        name: "Real-world like identifier",
        input: "0x742d35cc6c4b4c5c4f4e4a4d4b4b4a4c4e4f4e4d",
        description: "Test with realistic 20-byte identifier"
      },
      // Boundary cases
      {
        name: "Single byte",
        input: "0x42",
        description: "Test with single byte"
      },
      {
        name: "Two bytes",
        input: "0x4242",
        description: "Test with two bytes"
      }
    ];
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log("🧪 DID SDK Encode/Decode Test Suite");
    console.log("=" .repeat(50));
    
    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const testCase of this.testCases) {
      try {
        const result = this.runSingleTest(testCase);
        if (result.success) {
          console.log(`✅ ${testCase.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${testCase.name}: FAILED`);
          console.log(`   Expected: ${testCase.input}`);
          console.log(`   Got:      ${result.decoded}`);
          console.log(`   Via:      ${result.encoded}`);
          failed++;
          failures.push({ testCase, result });
        }
      } catch (error) {
        console.log(`💥 ${testCase.name}: ERROR - ${error.message}`);
        failed++;
        failures.push({ testCase, error });
      }
    }

    console.log("\n" + "=" .repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failures.length > 0) {
      console.log("\n🔍 Failure Details:");
      failures.forEach(({ testCase, result, error }) => {
        console.log(`\n• ${testCase.name}:`);
        console.log(`  Description: ${testCase.description}`);
        if (error) {
          console.log(`  Error: ${error.message}`);
        } else {
          console.log(`  Input:    ${testCase.input}`);
          console.log(`  Encoded:  ${result.encoded}`);
          console.log(`  Decoded:  ${result.decoded}`);
          console.log(`  Match:    ${result.success}`);
        }
      });
    }

    return { passed, failed, total: this.testCases.length };
  }

  /**
   * Run a single test case
   */
  runSingleTest(testCase) {
    const { input } = testCase;
    
    const encoded = encodeWeb5DIDString(input);
    const decoded = decodeWeb5DIDString(encoded);
    const success = input.toLowerCase() === decoded.toLowerCase();
    
    return {
      success,
      encoded,
      decoded,
      input
    };
  }

  /**
   * Run specific test by name
   */
  runTestByName(testName) {
    const testCase = this.testCases.find(t => 
      t.name.toLowerCase().includes(testName.toLowerCase())
    );
    
    if (!testCase) {
      console.log(`❌ Test '${testName}' not found`);
      return null;
    }
    
    console.log(`🧪 Running test: ${testCase.name}`);
    const result = this.runSingleTest(testCase);
    
    if (result.success) {
      console.log(`✅ PASSED`);
      console.log(`   ${testCase.input} -> ${result.encoded} -> ${result.decoded}`);
    } else {
      console.log(`❌ FAILED`);
      console.log(`   Expected: ${testCase.input}`);
      console.log(`   Got:      ${result.decoded}`);
    }
    
    return result;
  }

  /**
   * Add custom test case
   */
  addTestCase(name, input, description = "") {
    this.testCases.push({ name, input, description });
  }

  /**
   * Interactive test runner
   */
  async runInteractive() {
    console.log("🔧 Interactive DID SDK Test Runner");
    console.log("Enter hex identifiers to test (press Enter twice to exit):");
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };
    
    while (true) {
      const input = await askQuestion("\nEnter hex identifier (or press Enter to exit): ");
      
      if (!input.trim()) {
        break;
      }
      
      try {
        const testCase = { 
          name: "Interactive test", 
          input: input.trim(),
          description: "User provided test case"
        };
        
        const result = this.runSingleTest(testCase);
        
        if (result.success) {
          console.log(`✅ SUCCESS: ${result.input} -> ${result.encoded} -> ${result.decoded}`);
        } else {
          console.log(`❌ FAILED: ${result.input} -> ${result.encoded} -> ${result.decoded}`);
        }
      } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
      }
    }
    
    rl.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testSuite = new DIDSDKTestSuite();
  
  if (args.length === 0) {
    // Run all tests
    const results = await testSuite.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  } else if (args[0] === '--interactive' || args[0] === '-i') {
    // Interactive mode
    await testSuite.runInteractive();
  } else if (args[0] === '--test' || args[0] === '-t') {
    // Run specific test
    if (args[1]) {
      testSuite.runTestByName(args[1]);
    } else {
      console.log("Please provide a test name: node tests/did-sdk.test.js -t 'test name'");
    }
  } else if (args[0] === '--help' || args[0] === '-h') {
    // Show help
    console.log(`
🧪 DID SDK Test Suite

Usage:
  node tests/did-sdk.test.js              # Run all tests
  node tests/did-sdk.test.js -i           # Interactive mode
  node tests/did-sdk.test.js -t "name"    # Run specific test
  node tests/did-sdk.test.js -h           # Show this help

Examples:
  node tests/did-sdk.test.js -t "short hex"
  node tests/did-sdk.test.js --interactive
    `);
  } else {
    console.log("Unknown option. Use -h for help.");
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DIDSDKTestSuite, encodeWeb5DIDString, decodeWeb5DIDString }; 
