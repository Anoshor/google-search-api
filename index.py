import re
import requests
import pandas as pd
from keys import API_KEY, SEARCH_ENGINE_ID

def clean_filename(filename):

    filename = re.sub(r'[\\/*?:"<>|]', "", filename) #remove special chars
    return filename

def build_payload(query, start = 1, num = 10, date_restrict = 'm1', **params):
    '''
    function to build the payload for the Google Search api request
    '''
    payload = {
        'key': API_KEY,
        'q': query,
        'cx': SEARCH_ENGINE_ID,
        'start': start,
        'num': num,
        'dateRestrict': date_restrict
    }

    payload.update(params)
    return payload

def make_request(payload):

    response = requests.get('https://www.googleapis.com/customsearch/v1', params = payload)

    if response.status_code != 200:
        raise Exception('Request Failed')

    return response.json()

def main(query, result_total = 10):

    items = []

    rem = result_total % 10
    if rem > 0:
        pages = (result_total // 10) + 1
    else:
        pages = result_total // 10

    for i in range(pages):

        if pages == i + 1 and rem > 0:
            payload = build_payload(query, start=(i+1)*10, num = rem)

        else:
            payload = build_payload(query, start=(i+1)*10)

        response = make_request(payload)

        items.extend(response['items'])

    query_string = clean_filename(query)
    df = pd.json_normalize(items)

    df.to_excel('Google Search Result_{0}.xlsx'.format(query_string), index = False)
    #from the json.. extract only the 'displayLink' 


if __name__ == '__main__':

    search_query = 'ChatGPT'
    results = 30
    main(search_query, results)