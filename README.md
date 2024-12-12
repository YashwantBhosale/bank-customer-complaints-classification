## Overview

This is a simple project that automatically classifies the bank customer complaints submitted to the Consumer Financial Protection Bureau into five distinct categories: credit reporting, debt collection, mortgages and loans, credit cards, and retail banking.
This project uses basic Natural Language Processing (NLP) techniques to preprocess the text data and then applies a supervised machine learning model to classify the complaints into the five categories.
The model is trained on a dataset of roughly 1,25,000 bank customer complaints and achieves an accuracy of 85% on the test set.

**For detailed report please refer to full report [here]('/docs/Report.pdf').**

### Dataset

You can view/download the dataset from [here](https://www.kaggle.com/datasets/adhamelkomy/bank-customer-complaint-analysis/data).

### Demo

There is a simple implementation of a web app for this project, and its demo is available [here](https://bank-complaint-classification.vercel.app/).

*Note: The web app is not fully functional yet. It is just a simple demo to show how the model can be used in a real-world scenario.*

#### Credentials for Testing

```
{
    "admin" : {
        "email" : "admin@gmail.com",
        "password" : "admin@123"
    },
    "user" : {
        "email" : "user@gmail.com",
        "password" : "user@123"
    }
}

```
