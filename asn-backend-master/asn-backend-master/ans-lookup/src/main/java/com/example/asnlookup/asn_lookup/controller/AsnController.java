package com.example.asnlookup.asn_lookup.controller;
import com.example.asnlookup.asn_lookup.service.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/asn/india")
@CrossOrigin(origins = "*")
public class AsnController
{

    private final AsnDataCollectionAndComparisonService asnService;
    public AsnController(AsnDataCollectionAndComparisonService asnService) {
        this.asnService = asnService;
    }

    // to fetch all indian asn from all rirs
    @GetMapping("/all")
    public ResponseEntity<String> getAllAsns() {
        try {
            List<String> indianAsns = asnService.fetchAndExportIndianAsns();
            String responseText = String.join("\n", indianAsns);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("indian_asns.txt").build());

            return new ResponseEntity<>(responseText, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching ASNs: " + e.getMessage());
        }
    }


    private static final Logger logger = LoggerFactory.getLogger(AsnController.class);

    @Autowired
    private AsnLookupService asnIPlookup;

    @Autowired
    private ObjectMapper objectMapper;

    record ErrorResponse(String message, String details) {}

    @GetMapping("/asn/{asn}")
    public ResponseEntity<?> getASNDetails(@PathVariable String asn) {
        try {
            String jsonResponse = asnIPlookup.fetchAndSaveAsnDetails(asn);
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode dataNode = root.path("data"); // Important part
            JsonNode prefixesNode = dataNode.path("prefixes");

            ObjectNode result = objectMapper.createObjectNode();
            result.put("asn", asn);
            result.put("name", "N/A"); // RIPEstat does not provide ASN name here
            result.set("prefixes", prefixesNode);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("❌ Error fetching ASN details for {}: {}", asn, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("❌ Error fetching ASN details for ASN: " + asn, e.getMessage()));
        }
    }


    //get all asn registered in caida
    @GetMapping("/caida")
    public ResponseEntity<String> getIndianAsnsFromCaida() {
        try {
            List<String> indianAsns = asnService.fetchIndianAsnsFromCaida();
            String responseText = String.join("\n", indianAsns);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("indian_asns_caida.txt").build());

            return new ResponseEntity<>(responseText, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching ASNs: " + e.getMessage());
        }
    }



    //find the difference asns
    @GetMapping("/difference")
    public ResponseEntity<String> getAsnDifference() {
        try {
            List<String> missingAsns = asnService.runFullComparisonPipeline();
            String responseText = String.join("\n", missingAsns);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("missing_asns_in_caida.txt").build());

            return new ResponseEntity<>(responseText, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error comparing ASNs: " + e.getMessage());
        }
    }


    // scraping caida data about spoofin of india in a file
    @Autowired
    private SpoofingDataScrapingService asnScraping;

    @GetMapping("/scrap")
    public ResponseEntity<String> scrapeSpoofingData() {
        try {
            List<String> spoofData = asnScraping.scrapeSpoofingData();
            String text = String.join("\n", spoofData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("caida_spoof_data.txt").build());

            return new ResponseEntity<>(text, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during scraping: " + e.getMessage());
        }
    }



    // scraping caida data about spoofin of india in five  differnt section (no data,error,unknown ,rewritten,recieved)
    @Autowired
    private spoofingDetailesService asnProcessorService;

    @GetMapping("/scraping")
    public ResponseEntity<String> processAsnsAndReturnResult() {
        try {
            String inputFile = "A:\\projects\\asn-explorer\\asn-backend-master\\asn-backend-master\\ans-lookup\\indian_asns_from_rirs_20250610_124117.txt"; // You can also accept this as a param
            Map<String, List<String>> categorized = asnProcessorService.processAsnsFromFileAndReturn(inputFile);

            StringBuilder responseText = new StringBuilder();
            for (Map.Entry<String, List<String>> entry : categorized.entrySet()) {
                responseText.append("Category: ").append(entry.getKey()).append("\n");
                for (String asn : entry.getValue()) {
                    responseText.append("  ").append(asn).append("\n");
                }
                responseText.append("\n");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("asn_processing_result.txt").build());

            return new ResponseEntity<>(responseText.toString(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing ASNs: " + e.getMessage());
        }
    }



    //fetch ip of all asn whoose status is unknown
    @Autowired
    private IpUnknownStatusService asNdetailsService;

    @GetMapping("/ip_fetch")
    public ResponseEntity<List<String>> extractAsnIp() {
        try {
            // You can make this dynamic or configurable
            String inputFilePath = "A:\\projects\\asn-explorer\\asn-backend-master\\asn-backend-master\\ans-lookup\\output\\unknown.csv";
            List<String> data = asNdetailsService.extractAsnAndIpFromFile(inputFilePath);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("Error extracting ASN and IP data: " + e.getMessage()));
        }
    }



    //find ip details when entered
    @Autowired
    private IPLookupService ipWhoisService;

    @GetMapping("/{ip}")
    public ResponseEntity<?> getIPDetails(@PathVariable String ip) {
        try {
            // ✅ Fetch WHOIS data and save to file (returns JSON string)
            String jsonResponse = ipWhoisService.fetchAndSaveIPWhois(ip);

            // ✅ Parse JSON string into JsonNode for clean JSON output
            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(jsonResponse);

            // ✅ Return actual JSON (React will consume with response.json())
            return ResponseEntity.ok(json);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Error fetching WHOIS details for IP: " + ip + "\n" + e.getMessage());
        }
    }


}
