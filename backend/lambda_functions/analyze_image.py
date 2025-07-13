import json
import boto3
import os
from typing import Dict, List

rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        body = json.loads(event['body'])
        image_url = body.get('imageUrl')
        
        if not image_url:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Image URL is required'})
            }
        
        # Extract S3 bucket and key from URL
        # Expected format: https://bucket-name.s3.amazonaws.com/key
        try:
            url_parts = image_url.replace('https://', '').split('/')
            bucket_parts = url_parts[0].split('.s3.amazonaws.com')
            bucket = bucket_parts[0]
            key = '/'.join(url_parts[1:])
        except:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid S3 image URL format'})
            }
        
        # Analyze image with Rekognition
        analysis_result = analyze_product_image(bucket, key)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(analysis_result)
        }
        
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def analyze_product_image(bucket: str, key: str) -> Dict:
    """Analyze product image and generate description and category"""
    
    try:
        # Detect labels (objects, scenes, activities)
        labels_response = rekognition.detect_labels(
            Image={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            },
            MaxLabels=20,
            MinConfidence=70
        )
        
        # Detect text in image (for product names, brands)
        text_response = rekognition.detect_text(
            Image={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )
        
        # Process labels
        labels = [label['Name'] for label in labels_response['Labels']]
        confidence_scores = {label['Name']: label['Confidence'] for label in labels_response['Labels']}
        
        # Process detected text
        detected_text = []
        for text_detection in text_response['TextDetections']:
            if text_detection['Type'] == 'LINE' and text_detection['Confidence'] > 80:
                detected_text.append(text_detection['DetectedText'])
        
        # Generate category and description
        category = determine_category(labels, confidence_scores)
        description = generate_description(labels, detected_text, confidence_scores)
        
        return {
            'category': category,
            'description': description,
            'labels': labels[:10],  # Top 10 labels
            'detectedText': detected_text[:5],  # Top 5 text detections
            'confidence': 'high' if max(confidence_scores.values()) > 85 else 'medium'
        }
        
    except Exception as e:
        print(f"Rekognition error: {str(e)}")
        # Return fallback response
        return {
            'category': 'General',
            'description': 'Product available for purchase',
            'labels': [],
            'detectedText': [],
            'confidence': 'low',
            'error': 'Image analysis unavailable'
        }

def determine_category(labels: List[str], confidence_scores: Dict[str, float]) -> str:
    """Determine product category based on detected labels"""
    
    # Category mapping with keywords
    category_mappings = {
        'Electronics': ['phone', 'computer', 'laptop', 'tablet', 'camera', 'headphones', 'speaker', 'monitor', 'keyboard', 'mouse', 'cable', 'charger', 'electronics', 'device', 'screen'],
        'Clothing': ['shirt', 'pants', 'dress', 'jacket', 'coat', 'shoes', 'boots', 'hat', 'clothing', 'apparel', 'fashion', 'textile', 'fabric', 'garment'],
        'Home & Garden': ['furniture', 'chair', 'table', 'lamp', 'decoration', 'plant', 'flower', 'vase', 'cushion', 'pillow', 'blanket', 'curtain', 'home', 'garden'],
        'Kitchen': ['cup', 'mug', 'plate', 'bowl', 'spoon', 'fork', 'knife', 'pot', 'pan', 'kitchen', 'cooking', 'food', 'utensil', 'appliance'],
        'Books': ['book', 'magazine', 'text', 'reading', 'paper', 'literature', 'novel', 'guide', 'manual'],
        'Sports': ['ball', 'equipment', 'sports', 'fitness', 'exercise', 'gym', 'athletic', 'game', 'outdoor'],
        'Beauty': ['cosmetics', 'makeup', 'perfume', 'beauty', 'skincare', 'lotion', 'cream', 'lipstick'],
        'Toys': ['toy', 'game', 'doll', 'puzzle', 'children', 'kids', 'play', 'fun'],
        'Automotive': ['car', 'vehicle', 'automotive', 'wheel', 'tire', 'parts', 'motor'],
        'Health': ['medicine', 'health', 'medical', 'vitamin', 'supplement', 'pharmacy', 'wellness']
    }
    
    # Score each category
    category_scores = {}
    for category, keywords in category_mappings.items():
        score = 0
        for label in labels:
            label_lower = label.lower()
            for keyword in keywords:
                if keyword in label_lower:
                    # Weight by confidence score
                    score += confidence_scores.get(label, 0) / 100
                    break
        category_scores[category] = score
    
    # Return category with highest score, or 'General' if no good match
    if category_scores and max(category_scores.values()) > 0.3:
        return max(category_scores, key=category_scores.get)
    else:
        return 'General'

def generate_description(labels: List[str], detected_text: List[str], confidence_scores: Dict[str, float]) -> str:
    """Generate product description based on analysis"""
    
    # Filter out generic labels
    generic_labels = {'object', 'thing', 'item', 'product', 'material', 'solid', 'abstract'}
    relevant_labels = [label for label in labels[:8] if label.lower() not in generic_labels]
    
    # Start with detected text if available
    description_parts = []
    
    if detected_text:
        # Use first detected text as potential product name/brand
        main_text = detected_text[0]
        if len(main_text) > 2 and len(main_text) < 50:
            description_parts.append(main_text)
    
    # Add primary characteristics
    if relevant_labels:
        primary_labels = relevant_labels[:3]
        if len(primary_labels) == 1:
            description_parts.append(f"High-quality {primary_labels[0].lower()}")
        elif len(primary_labels) == 2:
            description_parts.append(f"{primary_labels[0]} with {primary_labels[1].lower()} features")
        else:
            description_parts.append(f"{primary_labels[0]} featuring {primary_labels[1].lower()} and {primary_labels[2].lower()}")
    
    # Add quality indicator based on confidence
    high_confidence_labels = [label for label, conf in confidence_scores.items() if conf > 90]
    if high_confidence_labels:
        description_parts.append("Premium quality item")
    
    # Combine parts
    if description_parts:
        description = ". ".join(description_parts)
        if not description.endswith('.'):
            description += '.'
        return description
    else:
        return "Quality product available for purchase."