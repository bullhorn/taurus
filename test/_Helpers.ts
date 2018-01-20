export const okJsonResponse = (data: any = {}) => {
    return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(data)
    ];
}

export const candidateMetaResponse = (fields: string[] = []) => {
    return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
            entity: 'Candidate',
            entityMetaUrl: 'http://rest.bullhorn.com/v2/meta/Candidate?fields=*',
            label: 'Candidate',
            dateLastModified: '1498742805319',
            fields: [
                {
                    name: 'id',
                    type: 'ID',
                    dataType: 'Integer'
                },
                {
                    name: 'name',
                    type: 'SCALAR',
                    dataType: 'String',
                    maxLength: 100,
                    confidential: false,
                    label: 'Name',
                    hideFromSearch: false
                },
                {
                    name: 'phone',
                    type: 'SCALAR',
                    dataType: 'String',
                    maxLength: 20,
                    confidential: false,
                    label: 'Phone',
                    hideFromSearch: false
                }
            ].filter(field => !fields.length || fields.indexOf(field.name))
        })
    ];
}

export const candidateListResponse = () => {
    return (xhr) => {
        let params: any = {};
        xhr.url.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'), function ($0, $1, $2, $3) {
            params[decodeURIComponent($1)] = decodeURIComponent($3);
        });
        xhr.respond(200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({
                total: 101219,
                start: 0,
                count: 20,
                data: [
                    {
                        id: 474039,
                        name: 'Gale Wiedeman',
                        phone: '209-823-9083',
                        _score: 1
                    },
                    {
                        id: 474040,
                        name: 'Peter Kondiles',
                        phone: '406-494-6806',
                        _score: 1
                    },
                    {
                        id: 474042,
                        name: 'Greg Cooper',
                        phone: '760-631-0852',
                        _score: 1
                    },
                    {
                        id: 474044,
                        name: 'Nemy Bautista',
                        phone: '916-616-6369',
                        _score: 1
                    },
                    {
                        id: 474215,
                        name: 'Richard Tyrrell',
                        phone: '707-251-8695',
                        _score: 1
                    },
                    {
                        id: 474220,
                        name: 'Michael Little',
                        phone: '(415) 928-2762',
                        _score: 1
                    },
                    {
                        id: 474227,
                        name: 'John Randall',
                        phone: '925.625.1969',
                        _score: 1
                    },
                    {
                        id: 474237,
                        name: 'WAYNE SCHAUCHULIS',
                        phone: '(650) 508-8360',
                        _score: 1
                    },
                    {
                        id: 474239,
                        name: 'Regina Garrett',
                        phone: '415.617.3241',
                        _score: 1
                    },
                    {
                        id: 474637,
                        name: 'Harvinder S. Bhella',
                        phone: '408-910-9064',
                        _score: 1
                    },
                    {
                        id: 474638,
                        name: 'JEFFREY STARKEY',
                        phone: '(707) 450-0111',
                        _score: 1
                    },
                    {
                        id: 474644,
                        name: 'Jeffrey Beriones',
                        phone: '(925) 686-0884',
                        _score: 1
                    },
                    {
                        id: 474662,
                        name: 'LESLIE FEY',
                        phone: '(916)989-5179',
                        _score: 1
                    },
                    {
                        id: 474667,
                        name: 'Clifton Jordan',
                        phone: '858-259-7390',
                        _score: 1
                    },
                    {
                        id: 474671,
                        name: 'David Owens',
                        phone: '(805) 717-1953',
                        _score: 1
                    },
                    {
                        id: 474680,
                        name: 'VAHAG VIC OVASAPIAN',
                        phone: '(818) 240-8312',
                        _score: 1
                    },
                    {
                        id: 474694,
                        name: 'jogert abrantes',
                        phone: '4083061359',
                        _score: 1
                    },
                    {
                        id: 474721,
                        name: 'DEMETRIUS SPRATLEY',
                        phone: '(909) 672-0330',
                        _score: 1
                    },
                    {
                        id: 474740,
                        name: 'ANNETTE LI',
                        phone: '(415) 351-2620',
                        _score: 1
                    },
                    {
                        id: 474962,
                        name: 'EDGAR HOLLINGSWORTH',
                        phone: '925-634-2726',
                        _score: 1
                    }
                ].slice(0, params.count)
            })
        ];
    };
}